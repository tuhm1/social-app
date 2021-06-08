const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    messageId: { type: mongoose.Types.ObjectId, required: true }
});

schema.index({ userId: 1, messageId: 1 });

const Notification = mongoose.model('message_notification', schema);
module.exports = Notification;