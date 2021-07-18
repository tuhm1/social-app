const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    text: String,
    files: [{
        url: { type: String, required: true },
        resourceType: { type: String, required: true },
        faces: [{
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            width: { type: Number, required: true },
            height: { type: Number, required: true },
            userId: mongoose.Types.ObjectId
        }]
    }],
    tags: [String],
    userId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });

schema.plugin(mongooseDelete);

schema.index({ userId: 1, createdAt: -1 });
schema.index({ text: 'text' });

schema.pre('remove', async function (next) {
    try {
        const p1 = mongoose.models.like.find({ postId: this._id })
            .then(likes => Promise.all(likes.map(l => l.remove())));
        const p2 = mongoose.models.comment.find({ postId: this._id })
            .then(comments => Promise.all(comments.map(c => c.remove())));
        const p3 = mongoose.models.reported_post.find({ postId: this._id })
            .then(reports => Promise.all(reports.map(r => r.remove())))
        await Promise.all([p1, p2]);
        next();
    } catch (error) {
        next(error);
    }
});

const Post = mongoose.model('post', schema);
module.exports = Post;