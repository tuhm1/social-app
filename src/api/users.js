module.exports = io => {
    const express = require('express');
    const app = express.Router();

    const { User } = require('../db/user');

    const multer = require('multer');
    const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
    const upload = multer({
        storage: new CloudinaryStorage({
            folder: process.env.CLOUDINARY_FOLDER || 'dev'
        })
    }).single('new_avatar');

    app
        .put('/', upload, async (req, res) => {
            const user = await User.findById(req.user);
            const { avatar_action, first_name, last_name, bio } = req.body;
            if (avatar_action === 'delete') {
                user.avatar = null;
            } else if (avatar_action === 'change') {
                user.avatar = req.file.secure_url;
            }
            user.first_name = first_name;
            user.last_name = last_name;
            if (bio) user.bio = bio;
            await user.save();
            res.json(user);
            io.emit('user/update', user);
        })
        .get('/', async (req, res) => {
            const users = await User.aggregate([
                { $set: { name: { $concat: ['$firstName', ' ', '$lastName'] } } },
                { $match: { name: { $regex: `^${req.query.q}`, $options: 'i' } } },
                { $project: { _id: 1, firstName: 1, lastName: 1, avatar: 1 } }
            ]);
            res.json(users);
        })
    return app;
}