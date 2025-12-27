const Prescription = require('../models/Prescription');
const User = require('../models/User');
const mongoose = require('mongoose');
const createPrescription = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can write prescriptions' });
        }
        const { patientId, diagnosis, medicines, instructions } = req.body;
        const patient = await User.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id,
            diagnosis,
            medicines,
            instructions
        });
        const fullPrescription = await Prescription.findById(prescription._id)
            .populate('patientId', 'name email age gender')
            .populate('doctorId', 'name specialization doctorId email contact');
        res.status(201).json(fullPrescription);
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Server error while creating prescription' });
    }
};
const getPrescriptions = async (req, res) => {
    try {
        let query = ;
        if (req.user.role === 'patient') {
            query = { patientId: req.user._id };
        } else if (req.user.role === 'doctor') {
            query = { doctorId: req.user._id };
        } else if (req.user.role === 'admin') {
            query = ; 
        } else {
            return res.status(403).json({ message: 'Unauthorized role' });
        }
        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'name email patientId age gender')
            .populate('doctorId', 'name specialization doctorId contact email')
            .sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'name email patientId age gender')
            .populate('doctorId', 'name specialization doctorId contact email');
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        const isPatient = req.user.role === 'patient' && prescription.patientId._id.toString() === req.user._id.toString();
        const isDoctor = req.user.role === 'doctor' && prescription.doctorId._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isPatient && !isDoctor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this prescription' });
        }
        res.json(prescription);
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const updatePrescription = async (req, res) => {
    try {
        let prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        if (prescription.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this prescription' });
        }
        const { diagnosis, medicines, instructions } = req.body;
        prescription.diagnosis = diagnosis || prescription.diagnosis;
        prescription.medicines = medicines || prescription.medicines;
        prescription.instructions = instructions || prescription.instructions;
        const updatedPrescription = await prescription.save();
        res.json(updatedPrescription);
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const deletePrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        if (prescription.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this prescription' });
        }
        await prescription.deleteOne();
        res.json({ message: 'Prescription removed' });
    } catch (error) {
        console.error('Error deleting prescription:', error);
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
