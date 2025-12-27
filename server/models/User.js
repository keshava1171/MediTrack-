const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin', 'caregiver'],
        default: 'patient'
    },
    specialization: {
        type: String,
        enum: ['General Physician', 'General Surgeon', 'Cardiologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'Dermatologist', 'Pulmonologist'],
        required: function () { return this.role === 'doctor'; }
    },
    assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    contact: { type: String },
    address: { type: String },
    patientId: { type: String, unique: true, sparse: true },
    doctorId: { type: String, unique: true, sparse: true },
    adminId: { type: String, unique: true, sparse: true },
    bloodGroup: { type: String },
    medicalHistory: [{ type: String }],
    allergies: [{ type: String }],
    photoUrl: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date }
}, {
    timestamps: true
});
userSchema.pre('save', async function () {
    console.log('Pre-save hook running for user:', this._id);
    if (!this.isModified('password')) 
    if (!this.patientId && this.role === 'patient') {
        const uniqueId = 'PID-' + Math.floor(100000 + Math.random() * 900000);
        this.patientId = uniqueId;
    }
    if (!this.doctorId && this.role === 'doctor') {
        const uniqueId = 'DID-' + Math.floor(100000 + Math.random() * 900000);
        this.doctorId = uniqueId;
    }
    if (!this.adminId && this.role === 'admin') {
        const uniqueId = 'AID-' + Math.floor(100000 + Math.random() * 900000);
        this.adminId = uniqueId;
    }
});
module.exports = mongoose.model('User', userSchema);
