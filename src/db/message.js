const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    senderId: { type: mongoose.Types.ObjectId, required: true },
    conversationId: { type: mongoose.Types.ObjectId, required: true },
    text: String,
    files: [{
        url: { type: String, required: true },
        resourceType: { type: String, required: true }
    }]
}, { timestamps: true });

schema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('message', schema);
module.exports = Message;