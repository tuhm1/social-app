const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    postId: { type: mongoose.Types.ObjectId, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });
schema.index({ postId: 1, userId: 1 }, { unique: true });
schema.plugin(mongooseDelete);
const Like = mongoose.model('like', schema);
module.exports = Like;