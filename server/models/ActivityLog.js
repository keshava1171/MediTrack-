const mongoose = require('mongoose');
const activityLogSchema = mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: false
    },
    color: {
        type: String,
        enum: ['green', 'blue', 'yellow', 'red', 'purple', 'gray'],
        default: 'blue'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('ActivityLog', activityLogSchema);
