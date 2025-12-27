const mongoose = require('mongoose');
const prescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis: { type: String, required: true },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],
    instructions: { type: String }, 
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});
module.exports = mongoose.model('Prescription', prescriptionSchema);
