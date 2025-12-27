const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPrescription,
    getPrescriptions,
    getPrescriptionById,
    updatePrescription,
    deletePrescription
} = require('../controllers/prescriptionController');
router.post('/', protect, createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.put('/:id', protect, updatePrescription);
router.delete('/:id', protect, deletePrescription);
module.exports = router;
