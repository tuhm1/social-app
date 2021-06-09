
module.exports = io => {
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
                    User.findById(_id, { firstName: 1, lastName: 1, avatar: 1, bio: 1 }).lean(),
                    Follow.countDocuments({ followingId: _id }),
                    req.user && Follow.exists({ followingId: _id, followerId: req.user }),
                    Post.countDocuments({ userId: _id }),
                    Post.aggregate([
                        { $match: { userId: mongoose.Types.ObjectId(_id) } },
                        { $sort: { createdAt: -1 } },
                        { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
                        { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
                        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                        { $unwind: '$user' },
                        ...(req.user
                            ? [
                                {
                                    $lookup: {
                                        from: 'likes', as: 'liked',
                                        let: { postId: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ['$userId', mongoose.Types.ObjectId(req.user)] },
                                                            { $eq: ['$postId', '$$postId'] }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                { $set: { liked: { $gt: [{ $size: '$liked' }, 0] } } }
                            ]
                            : []
                        ),
                        {
                            $project: {
                                _id: 1, text: 1, files: 1, 'user._id': 1, 'user.avatar': 1,
                                'user.firstName': 1, 'user.lastName': 1,
                                likesCount: { $size: '$likes' },
                                liked: 1,
                                commentsCount: { $size: '$comments' }
                            }
                        },
                    ]),
                ]);
                res.json({ user, followersCount, followed, posts, postsCount, currentUserId: req.user });
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