const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    postId: { type: mongoose.Types.ObjectId, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });
schema.index({ postId: 1, userId: 1 }, { unique: true });
schema.plugin(mongooseDelete);
schema.pre('remove', async function (next) {
    try {
        const notification = await mongoose.models.notification.findOne({ likeId: this._id });
        if (notification) {
            await notification.remove();
        }
        next();
    } catch (error) {
        next(error);
    }
});
const Like = mongoose.model('like', schema);
module.exports = Like;