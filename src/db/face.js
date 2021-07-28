const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    descriptor: { type: [Number], require: true }
});

schema.index({ userId: 1 });

const Face = mongoose.model('face', schema);
module.exports = Face;