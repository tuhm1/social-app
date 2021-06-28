
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
        .get('/following', async (req, res) => {
            if (!req.user) {
                return res.sendStatus(401);
            }
            const userId = mongoose.Types.ObjectId(req.user);
            Follow.aggregate([
                { $match: { followerId: userId } },
                { $lookup: { from: 'posts', localField: 'followingId', foreignField: 'userId', as: 'posts' } },
                { $unwind: '$posts' },
                { $replaceRoot: { newRoot: '$posts' } },
                { $sort: { createdAt: -1, _id: -1 } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
                ...(req.user
                    ? [{ $set: { liked: { $in: [userId, '$likes.userId'] } } }]
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
            ]).then(posts => {
                res.json(posts);
            }).catch(error => {
                res.sendStatus(500);
            });
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
        })
        .put('/:_id', (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'User is not logged in' });
            }
            Post.findById(req.params._id)
                .then(post => {
                    if (!post.userId.equals(mongoose.Types.ObjectId(req.user))) {
                        return res.status(403).json({ message: 'Unauthorized' });
                    }
                    upload(req, res, error => {
                        if (error) {
                            return res.sendStatus(500);
                        }
                        const deletedFileIds = JSON.parse(req.body.deletedFiles)
                            .map(s => mongoose.Types.ObjectId(s));
                        const newFiles = req.files.map(f => ({
                            url: f.secure_url,
                            resourceType: f.resource_type
                        }));
                        post.text = req.body.text;
                        post.files = post.files
                            .filter(f => !deletedFileIds.some(id => f._id.equals(id)))
                            .concat(newFiles);
                        post.save()
                            .then(() => res.json(post))
                            .catch(error => {
                                if (error instanceof mongoose.Error.ValidationError)
                                    res.status(400).json(error);
                                else res.sendStatus(500);
                            });
                    });
                })
                .catch(error => {
                    res.sendStatus(500);
                });
        })
    return app;
}