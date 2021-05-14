const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    postId: { type: mongoose.Types.ObjectId, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    replyTo: { type: mongoose.Types.ObjectId },
    text: { type: String, required: true }
}, { timestamps: true });
schema.plugin(mongooseDelete);

schema.index({ postId: 1 });
schema.index({ replyTo: 1, postId: 1, createdAt: 1 });

const Comment = mongoose.model('comment', schema);
module.exports = Comment;