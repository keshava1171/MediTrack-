const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Heart Rate', 'Blood Pressure', 'SpO2', 'Temperature', 'Glucose', 'Weight'],
        required: true
    },
    value: {
        type: String, 
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Normal', 'Abnormal', 'Critical'],
        default: 'Normal'
    },
    notes: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HealthData', healthDataSchema);
