const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number },
    mimeType: { type: String },
    category: { type: String, enum: ['General', 'Blood Test', 'Prescription', 'Imaging', 'Discharge Summary', 'Lab Result', 'Diagnosis'], default: 'General' },
    notes: { type: String },
    type: { type: String, default: 'File' }, 
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 

    status: {
        type: String,
        enum: ['Active', 'Flagged', 'Archived'],
        default: 'Active'
    },

    visibility: {
        type: String,
        enum: ['Private', 'Doctor'],
        default: 'Private'
    },
    uploadedByRole: { type: String, enum: ['patient', 'doctor'] }, 
    flaggedReason: { type: String },
    auditNotes: { type: String },
    archivedAt: { type: Date },
    accessedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String },
        action: { type: String }, 
        timestamp: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
