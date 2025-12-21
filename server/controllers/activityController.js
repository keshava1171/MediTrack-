const ActivityLog = require('../models/ActivityLog');
const Alert = require('../models/Alert'); 
const User = require('../models/User');

const getRecentActivities = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createAlert = async (req, res) => {
    try {
        const { type, message, severity, patient } = req.body;
        const alert = await Alert.create({
            patient: patient || req.user._id,
            type,
            message,
            severity
        });

        const populatedAlert = await Alert.findById(alert._id).populate('patient', 'name patientId email');

        const io = req.app.get('io');
        if (io) {
            const patientId = populatedAlert?.patient?._id?.toString();
            const patientDoc = patientId ? await User.findById(patientId).select('assignedDoctors') : null;

            const alertToEmit = {
                ...populatedAlert.toObject(),
                patientId
            };

            if (patientId) {
                io.to(patientId).emit('healthAlert', alertToEmit);
                (patientDoc?.assignedDoctors || []).forEach((doctorId) => {
                    io.to(doctorId.toString()).emit('healthAlert', alertToEmit);
                });
            } else {
                io.emit('healthAlert', alertToEmit);
            }
        }

        res.status(201).json(populatedAlert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAlerts = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'patient') {
            query.patient = req.user._id;
        }

        if (req.user.role === 'guardian') {

            const guardian = await User.findById(req.user._id);
            if (guardian && guardian.requestedPatientId) {
                query.patient = guardian.requestedPatientId;
            } else {
                return res.json([]); 
            }
        }

        if (req.user.role === 'doctor' || req.user.role === 'admin') {
            
            query = {}; 
        }

        const alerts = await Alert.find(query)
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('patient', 'name patientId email');

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatientAlerts = async (req, res) => {
    try {
        const patientId = req.params.id || req.params.patientId;
        const alerts = await Alert.find({ patient: patientId })
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('patient', 'name patientId email');
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAlertRead = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        alert.isRead = true;
        await alert.save();
        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRecentActivities,
    createAlert,
    getAlerts,
    getPatientAlerts,
    markAlertRead
};
