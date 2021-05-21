const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    followerId: { type: mongoose.Types.ObjectId, required: true },
    followingId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });
schema.index({ followingId: 1, followerId: 1 }, { unique: true });

const Follow = mongoose.model('follow', schema);

module.exports = Follow;