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

schema.pre('remove', async function (next) {
    try {
        const p1 = mongoose.models.comment.find({ replyTo: this._id })
            .then(comments =>
                Promise.all(comments.map(c => c.remove()))
            );
        const p2 = mongoose.models.notification.find({
            $or: [{ replyId: this._id }, { commentId: this._id }]
        }).then(notifications =>
            Promise.all(notifications.map(n => n.remove()))
        );
        await Promise.all([p1, p2]);
        next();
    } catch (error) {
        next(error);
    }
});

const Comment = mongoose.model('comment', schema);

module.exports = Comment;