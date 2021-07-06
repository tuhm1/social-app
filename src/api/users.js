const express = require('express');
const app = express.Router();

const { User } = require('../db/user');
const Follow = require('../db/follow');
const Post = require('../db/post');
const mongoose = require('mongoose');

const multer = require('multer');
const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
const upload = multer({
    storage: new CloudinaryStorage({
        folder: process.env.CLOUDINARY_FOLDER || 'dev'
    })
}).single('new_avatar');

app
    .get('/:_id', async (req, res) => {
        const { _id } = req.params;
        try {
            const [user, followersCount, followed, postsCount, posts] = await Promise.all([
                User.findById(_id, { firstName: 1, lastName: 1, avatar: 1, bio: 1, username: 1, email: 1 }).lean(),
                Follow.countDocuments({ followingId: _id }),
                req.user && Follow.exists({ followingId: _id, followerId: req.user }),
                Post.countDocuments({ userId: _id }),

            ]);
            res.json({ user, followersCount, followed, postsCount, currentUserId: req.user });
        } catch (err) {
            res.status(500).json(err);
        }
    })
    .put('/', upload, async (req, res) => {
        const user = await User.findById(req.user);
        const { avatar_action, first_name, last_name, bio } = req.body;
        if (avatar_action === 'delete') {
            user.avatar = null;
        } else if (avatar_action === 'change') {
            user.avatar = req.file.secure_url;
        }
        user.firstName = first_name;
        user.lastName = last_name;
        if (bio) user.bio = bio;
        await user.save();
        res.json(user);
    })
    .get('/', async (req, res) => {
        const users = await User.find({ $text: { $search: req.query.q } });
        res.json(users);
    })

module.exports = app;