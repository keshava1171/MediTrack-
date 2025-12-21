const ActivityLog = require('../models/ActivityLog');

const logActivity = async (io, action, details = '', color = 'blue') => {
    try {
        const log = await ActivityLog.create({
            action,
            details,
            color,
            timestamp: new Date()
        });

        if (io) {
            io.emit('new_activity', log);
        }
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
};

module.exports = logActivity;
