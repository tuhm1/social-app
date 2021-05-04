const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const schema = new mongoose.Schema({
    text: String,
    files: [{
        publicId: { type: String, required: true, unique: true }, 
        url: { type: String, required: true },
        resourceType: { type: String, required: true }
    }],
    tags: [String],
    userId: { type: mongoose.Types.ObjectId, required: true }
}, { timestamps: true });
schema.plugin(mongooseDelete);
const Post = mongoose.model('post', schema);
module.exports = Post;