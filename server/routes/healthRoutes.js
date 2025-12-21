const express = require('express');
const router = express.Router();
const { addReading, getReadings, getLatestReadings } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware'); 

router.use(protect);

router.route('/')
    .get(getReadings)
    .post(addReading);

router.get('/latest', getLatestReadings);

router.get('/patient/:id', async (req, res) => {
    try {
        const HealthData = require('../models/HealthData');

        if (req.user.role !== 'doctor' && req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const readings = await HealthData.find({ patient: req.params.id }).sort({ timestamp: -1 });
        res.status(200).json(readings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
