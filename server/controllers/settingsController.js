const SystemSetting = require('../models/SystemSetting');
const logActivity = require('../utils/activityLogger');

const getSettings = async (req, res) => {
    try {
        let maintenance = await SystemSetting.findOne({ key: 'maintenanceMode' });
        let registrations = await SystemSetting.findOne({ key: 'allowRegistrations' });

        if (!maintenance) {
            maintenance = await SystemSetting.create({
                key: 'maintenanceMode',
                value: false,
                description: 'Prevent new logins and access for non-admins'
            });
        }
        if (!registrations) {
            registrations = await SystemSetting.create({
                key: 'allowRegistrations',
                value: true,
                description: 'Allow new user sign-ups'
            });
        }

        res.json({
            maintenanceMode: maintenance.value,
            allowRegistrations: registrations.value
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateSettings = async (req, res) => {
    const { maintenanceMode, allowRegistrations } = req.body;

    try {
        if (maintenanceMode !== undefined) {
            
            let regValue = allowRegistrations;
            if (maintenanceMode === true) {
                regValue = false;
                await SystemSetting.findOneAndUpdate(
                    { key: 'allowRegistrations' },
                    { value: false },
                    { upsert: true }
                );
            }

            await SystemSetting.findOneAndUpdate(
                { key: 'maintenanceMode' },
                { value: maintenanceMode },
                { upsert: true }
            );
        }

        if (allowRegistrations !== undefined && maintenanceMode !== true) {
            
            await SystemSetting.findOneAndUpdate(
                { key: 'allowRegistrations' },
                { value: allowRegistrations },
                { upsert: true }
            );
        }

        const updatedMaint = await SystemSetting.findOne({ key: 'maintenanceMode' });
        const updatedReg = await SystemSetting.findOne({ key: 'allowRegistrations' });

        res.json({
            maintenanceMode: updatedMaint.value,
            allowRegistrations: updatedReg.value
        });

        logActivity(req.app.get('io'), 'System Settings Updated', 'Admin updated system configuration.', 'purple');

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getSettings, updateSettings };
