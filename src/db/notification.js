const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const schema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    type: { type: String, required: true },
    seen: Date
}, { strict: false });
schema.plugin(mongooseDelete);
schema.index({ userId: 1 });
const Notification = mongoose.model('notification', schema);

module.exports = Notification;