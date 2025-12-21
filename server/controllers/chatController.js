const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');

const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.query;

    if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID required' });
    }

    const messages = await Message.find({ conversationId })
        .populate('replyTo', 'sender content type')
        .sort({ timestamp: 1 });
    res.json(messages);
});

const saveMessage = async (msgData) => {
    try {
        const message = await Message.create(msgData);
        
        if (message.replyTo) {
            await message.populate('replyTo', 'sender content type');
        }
        return message;
    } catch (err) {
        console.error('Error saving message:', err);
        return null;
    }
};

module.exports = { getMessages, saveMessage };
