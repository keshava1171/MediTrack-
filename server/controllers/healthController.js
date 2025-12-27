const mongoose = require('mongoose');
const HealthData = require('../models/HealthData');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const addReading = asyncHandler(async (req, res) => {
    const { type, value, unit, notes } = req.body;
    let status = 'Normal';
    const numValue = parseFloat(value);
    if (type === 'Heart Rate') {
        if (numValue < 60 || numValue > 100) status = 'Abnormal';
        if (numValue < 40 || numValue > 140) status = 'Critical';
    } else if (type === 'SpO2') {
        if (numValue < 95) status = 'Abnormal';
        if (numValue < 90) status = 'Critical';
    } else if (type === 'Temperature') {
        if (numValue > 37.5) status = 'Abnormal';
        if (numValue > 39) status = 'Critical';
    } else if (type === 'Glucose') {
        if (numValue < 70 || numValue > 140) status = 'Abnormal';
    }
    else if (type === 'Blood Pressure') {
        const parts = value.split('/');
        if (parts.length === 2) {
            const sys = parseFloat(parts[0]);
            const dia = parseFloat(parts[1]);
            if (sys > 120 || dia > 80) status = 'Abnormal';
            if (sys >= 140 || dia >= 90) status = 'Critical';
        }
    }
    const reading = await HealthData.create({
        patient: new mongoose.Types.ObjectId(req.user._id),
        type,
        value,
        unit,
        status,
        notes
    });
    const io = req.app.get('io');
    const patientId = req.user._id.toString();
    const patientDoc = await User.findById(patientId).select('assignedDoctors');
    if (io) {
        const readingToEmit = {
            ...reading.toObject(),
            patient: patientId,
            patientId
        };
        io.to(patientId).emit('healthUpdate', readingToEmit);
        (patientDoc?.assignedDoctors || []).forEach((doctorId) => {
            io.to(doctorId.toString()).emit('healthUpdate', readingToEmit);
        });
    }
    if (status === 'Abnormal' || status === 'Critical') {
        const Alert = require('../models/Alert');
        const alertMessage = `Patient ${req.user.name} has ${status} ${type}: ${value} ${unit}`;
        const newAlert = await Alert.create({
            patient: new mongoose.Types.ObjectId(req.user._id),
            type: 'Health Risk',
            message: alertMessage,
            severity: status === 'Critical' ? 'Critical' : 'Medium',
        });
        const populatedAlert = await Alert.findById(newAlert._id).populate('patient', 'name patientId email');
        console.log('Emitting populated alert:', populatedAlert);
        if (io) {
            const alertToEmit = {
                ...populatedAlert.toObject(),
                patientId
            };
            io.to(patientId).emit('healthAlert', alertToEmit);
            (patientDoc?.assignedDoctors || []).forEach((doctorId) => {
                io.to(doctorId.toString()).emit('healthAlert', alertToEmit);
            });
        }
    }
    res.status(201).json(reading);
});
const getReadings = asyncHandler(async (req, res) => {
    const readings = await HealthData.find({
        patient: new mongoose.Types.ObjectId(req.user._id)
    }).sort({ timestamp: -1 });
    res.status(200).json(readings);
});
const getLatestReadings = asyncHandler(async (req, res) => {
    const latestReadings = await HealthData.aggregate([
        { $match: { patient: new mongoose.Types.ObjectId(req.user._id) } },
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: "$type",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } }
    ]);
    res.status(200).json(latestReadings);
});
module.exports = {
    addReading,
    getReadings,
    getLatestReadings
};
