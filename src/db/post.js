const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    text: String,
    files: [{
        url: { type: String, required: true },
        resourceType: { type: String, required: true }
    }],
    tags: [String],
    userId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });

schema.plugin(mongooseDelete);

schema.index({ createdAt: -1, _id: -1 });
schema.index({ userId: 1, createdAt: -1, _id: -1 });

const Post = mongoose.model('post', schema);
module.exports = Post;