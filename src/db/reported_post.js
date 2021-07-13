const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const schema = new mongoose.Schema({
    postId: { type: mongoose.Types.ObjectId, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    reason: { type: String, required: true },
}, { timestamps: true });

schema.plugin(mongooseDelete);

const ReportedPost = mongoose.model('reported_post', schema);
module.exports = ReportedPost;