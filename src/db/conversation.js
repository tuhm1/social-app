const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    creatorId: { type: mongoose.Types.ObjectId },
    userIds: { type: [mongoose.Types.ObjectId], required: true },
    title: String,
});

schema.index({ userIds: 1 });

const Conversation = mongoose.model('conversation', schema);
module.exports = Conversation;