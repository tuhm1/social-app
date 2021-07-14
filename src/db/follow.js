const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    followerId: { type: mongoose.Types.ObjectId, required: true },
    followingId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });
schema.index({ followingId: 1, followerId: 1 }, { unique: true });
schema.index({ followerId: 1, followingId: 1 }, { unique: true });
schema.plugin(mongooseDelete);
schema.pre('remove', async function (next) {
    try {
        const notification = await mongoose.models.notification.findOne({ followId: this._id });
        if (notification) {
            await notification.remove();
        }
        next();
    } catch (error) {
        next(error);
    }
});
const Follow = mongoose.model('follow', schema);
module.exports = Follow;