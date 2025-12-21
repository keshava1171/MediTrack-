const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

const createPrescription = async (req, res) => {
    try {
        console.log(`[DEBUG] >>> CREATION REQUEST RECEIVED <<<`);
        console.log(`[DEBUG] Actor: ${req.user?.name} | Role: ${req.user?.role} | ID: ${req.user?._id || req.user?.id}`);

        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can write prescriptions' });
        }

        const { patientId, diagnosis, medicines, instructions } = req.body;

        const patient = await User.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id || req.user.id,
            diagnosis,
            medicines,
            instructions
        });

        res.status(201).json(prescription);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPrescriptions = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'patient') {
            query = { patientId: new mongoose.Types.ObjectId(req.user._id || req.user.id) };
        } else if (req.user.role === 'doctor') {
            query = { doctorId: new mongoose.Types.ObjectId(req.user._id || req.user.id) };
        } else if (req.user.role === 'admin') {
            query = {};
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        console.log(`[DEBUG] Fetching prescriptions for ROLE:${req.user.role} NAME:${req.user.name}`);
        console.log(`[DEBUG] Query Object:`, JSON.stringify(query));

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'name email patientId age gender')
            .populate('doctorId', 'name specialization doctorId contact email')
            .sort({ createdAt: -1 });

        console.log(`[DEBUG] Found ${prescriptions.length} prescriptions`);
        if (prescriptions.length > 0) {
            console.log(`[DEBUG] Result Set Attributes:`, prescriptions.map(p => ({
                id: p._id,
                issuer: p.doctorId?.name || 'Unknown',
                issuerID: p.doctorId?._id || p.doctorId
            })));
        }

        res.json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPrescriptionById = async (req, res) => {
    try {
        const actorId = req.user?._id || req.user?.id;
        if (!actorId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'name age gender')
            .populate('doctorId', 'name specialization contact');

        if (!prescription) return res.status(404).json({ message: 'Not found' });

        const actorIdStr = actorId.toString();
        const prescriptionPatientId = (prescription.patientId?._id || prescription.patientId).toString();
        const prescriptionDoctorId = (prescription.doctorId?._id || prescription.doctorId).toString();

        if (req.user.role === 'patient') {
            if (prescriptionPatientId !== actorIdStr) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        } else if (req.user.role === 'doctor') {
            if (prescriptionDoctorId !== actorIdStr) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePrescription = async (req, res) => {
    try {
        const actorId = req.user?._id || req.user?.id;
        if (!actorId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) return res.status(404).json({ message: 'Not found' });

        if (req.user.role === 'doctor') {
            if (prescription.doctorId.toString() !== actorId.toString()) {
                return res.status(403).json({ message: 'Can only edit your own prescriptions' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updated = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deletePrescription = async (req, res) => {
    try {
        const actorId = req.user?._id || req.user?.id;
        if (!actorId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (req.user.role === 'doctor') {
            if (prescription.doctorId.toString() !== actorId.toString()) {
                return res.status(403).json({ message: 'You can only delete your own prescriptions' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete prescriptions' });
        }

        await prescription.deleteOne();
        res.json({ message: 'Prescription removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createPrescription,
    getPrescriptions,
    getPrescriptionById,
    updatePrescription,
    deletePrescription
};
