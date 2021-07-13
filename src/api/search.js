const express = require('express');
const { User } = require('../db/user');
const Post = require('../db/post');
const mongoose = require('mongoose');

const app = express.Router();
app
    .get('/user', async (req, res) => {
        const users = await User.aggregateWithDeleted([
            { $match: { $text: { $search: req.query.text } } },
            { '$match': { deleted: { '$ne': true } } },
            { $lookup: { from: 'follows', localField: '_id', foreignField: 'followingId', as: 'followers' } },
            { $set: { followersCount: { $size: '$followers' } } }
        ]);
        res.json(users);
    })
    .get('/post', async (req, res) => {
        const posts = await Post.aggregate([
            { $match: { $text: { $search: req.query.text } } },
            { $sort: { createdAt: -1, _id: -1 } },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
            { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
            ...(req.user
                ? [{ $set: { liked: { $in: [mongoose.Types.ObjectId(req.user), '$likes.userId'] } } }]
                : []
            ),
            { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
            { $set: { user: { $arrayElemAt: ['$users', 0] } } },
            {
                $project: {
                    _id: 1, text: 1, files: 1, createdAt: 1,
                    'user._id': 1, 'user.avatar': 1,
                    'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
                    likesCount: { $size: '$likes' },
                    liked: 1,
                    commentsCount: { $size: '$comments' }
                }
            }
        ]);
        res.json(posts);
    })
module.exports = app;