
module.exports = io => {
    const express = require('express');
    const app = express.Router();
    const mongoose = require('mongoose');
    const Follow = require('../db/follow');
    const Post = require('../db/post');
    const multer = require('multer');
    const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
    const upload = multer({
        storage: new CloudinaryStorage({
            folder: process.env.CLOUDINARY_FOLDER || 'dev',
            resource_type: 'auto'
        })
    }).array('files');

    app
        .get('/home', async (req, res) => {
            const posts = await Post.aggregate([
                { $sort: { createdAt: -1, _id: -1 } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
                { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
                { $set: { user: { $arrayElemAt: ['$users', 0] } } },
                {
                    $project: {
                        _id: 1, text: 1, files: 1, createdAt: 1,
                        'user._id': 1, 'user.avatar': 1,
                        'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
                        commentsCount: { $size: '$comments' }
                    }
                }
            ]);
            res.json(posts);
        })
        .get('/following', async (req, res) => {
            if (!req.user) {
                return res.sendStatus(401);
            }
            const posts = await Follow.aggregate([
                { $match: { followerId: mongoose.Types.ObjectId(req.user) } },
                { $lookup: { from: 'posts', localField: 'followingId', foreignField: 'userId', as: 'posts' } },
                { $unwind: '$posts' },
                { $replaceRoot: { newRoot: '$posts' } },
                { $sort: { createdAt: -1, _id: -1 } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
                { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
                { $set: { user: { $arrayElemAt: ['$users', 0] } } },
                {
                    $project: {
                        _id: 1, text: 1, files: 1, createdAt: 1,
                        'user._id': 1, 'user.avatar': 1,
                        'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
                        commentsCount: { $size: '$comments' }
                    }
                }
            ]);
            res.json(posts);
        })
        .get('/details/:_id', (req, res) => {
            Post.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params._id) } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
                { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
                { $set: { user: { $arrayElemAt: ['$users', 0] } } },
                {
                    $project: {
                        _id: 1, text: 1, files: 1, createdAt: 1,
                        'user._id': 1, 'user.avatar': 1,
                        'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
                        'commentsCount': { $size: '$comments' }
                    }
                }
            ]).then(result => {
                res.json(result.length > 0 ? result[0] : null);
            }).catch(error => {
                res.status(500);
            });
        })
        .post('/', (req, res) => {
            if (!req.user) {
                res.status(401).json({ message: 'User is not logged in' });
            }
            upload(req, res, async err => {
                if (err) {
                    res.status(400).json(err);
                }
                try {
                    const post = await Post.create({
                        userId: req.user,
                        text: req.body.text,
                        files: req.files?.map(f => ({
                            url: f.secure_url,
                            resourceType: f.resource_type
                        }))
                    });
                    res.json(post);
                } catch (error) {
                    res.status(400).json(error);
                }
            });
        });
    return app;
}