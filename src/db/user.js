const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: String,
    bio: String,
    isAdmin: Boolean,
    isRoot: Boolean
}, { timestamps: true });

userSchema.index({ firstName: 'text', lastName: 'text', username: 'text', email: 'text' });

userSchema.plugin(mongooseDelete, { overrideMethods: true });

const User = mongoose.model('User', userSchema);

const localSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true, select: false }
});
const bcrypt = require('bcrypt');
localSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();
    bcrypt.hash(this.password, 10, (err, hash) => {
        if (err) return next(err);
        this.password = hash;
        next();
    });
});
localSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};
const LocalUser = User.discriminator('LocalUser', localSchema);

const googleSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true, sparse: true },
    email: { type: String }
});
const GoogleUser = User.discriminator('GoogleUser', googleSchema);

module.exports = { User, LocalUser, GoogleUser };
