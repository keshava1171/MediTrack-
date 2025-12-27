const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User'); const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
router.get('/', protect, asyncHandler(async (req, res) => {
    let query = ;
    if (req.user.role === 'patient') {
        query = { patient: req.user.id };
    } else if (req.user.role === 'doctor') {
        const doctor = await User.findById(req.user.id);
        query = { patient: { $in: doctor.assignedPatients || [] } };
    }
    const alerts = await Alert.find(query).populate('patient', 'name email').sort({ timestamp: -1 });
    res.json(alerts);
}));
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id);
    if (alert) {
        alert.isRead = true;
        const updatedAlert = await alert.save();
        res.json(updatedAlert);
    } else {
        res.status(404);
        throw new Error('Alert not found');
    }
}));
module.exports = router;
