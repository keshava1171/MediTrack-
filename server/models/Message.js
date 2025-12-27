const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true }, 
    type: { type: String, enum: ['text', 'file', 'image', 'location'], default: 'text' },
    content: { type: String }, 
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: String },
    location: {
        lat: Number,
        lng: Number
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, 
    conversationId: { type: String }, 
    likes: [{ type: String }], 
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String },
    role: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', messageSchema);
