
module.exports = io => {
    const express = require('express');
    const app = express.Router();
    const mongoose = require('mongoose');
    const Follow = require('../db/follow');
    const Post = require('../db/post');
    const { User } = require('../db/user');
    const Face = require('../db/face');
    const ReportedPost = require('../db/reported_post');
    const multer = require('multer');
    const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
    const upload = multer({
        storage: new CloudinaryStorage({
            folder: process.env.CLOUDINARY_FOLDER || 'dev',
            resource_type: 'auto'
        })
    }).array('files');

    app
        .get('/user/posts/:userId', async (req, res) => {
            const posts = await Post.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(req.params.userId) } },
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
                        _id: 1, text: 1, files: 1, createdAt: 1,
                        'user._id': 1, 'user.avatar': 1,
                        'user.firstName': 1, 'user.lastName': 1,
                        likesCount: { $size: '$likes' },
                        liked: 1,
                        commentsCount: { $size: '$comments' }
                    }
                },
            ]);
            const ids = [];
            posts.forEach(post => {
                post.files.forEach(file => {
                    file.faces?.forEach(face => face.userId && ids.push(face.userId));
                });
            });
            const users = await User.find({ _id: { $in: ids } });
            posts.forEach(post => {
                post.files.forEach(file => {
                    file.faces?.forEach(face => {
                        if (face.userId)
                            face.user = users.find(u => u._id.equals(face.userId));
                    });
                });
            });
            res.json(posts);
        })
        .get('/user/images/:userId', async (req, res) => {
            const posts = await Post.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(req.params.userId) } },
                { $unwind: '$files' },
                { $match: { 'files.resourceType': 'image' } },
                { $sort: { createdAt: -1 } },
            ]);
            res.json(posts);
        })
        .get('/user/videos/:userId', async (req, res) => {
            const posts = await Post.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(req.params.userId) } },
                { $unwind: '$files' },
                { $match: { 'files.resourceType': 'video' } },
                { $sort: { createdAt: -1 } },
            ]);
            res.json(posts);
        })
        .get('/user/tagged/:userId', async (req, res) => {
            const posts = await Post.aggregate([
                { $match: { 'files.faces.userId': mongoose.Types.ObjectId(req.params.userId) } },
                { $unwind: '$files' },
                { $match: { 'files.faces.userId': mongoose.Types.ObjectId(req.params.userId) } },
                { $sort: { createdAt: -1 } },
            ]);
            res.json(posts);
        })
        .get('/home', async (req, res) => {
            const { cursor, limit } = req.query;
            const posts = await Post.aggregate([
                ...(cursor
                    ? [{ $match: { _id: { $lt: mongoose.Types.ObjectId(cursor) } } }]
                    : []
                ),
                { $sort: { createdAt: -1, _id: -1 } },
                { $limit: limit || 10 },
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
            const ids = [];
            posts.forEach(post => {
                post.files.forEach(file => {
                    file.faces?.forEach(face => face.userId && ids.push(face.userId));
                });
            });
            const users = await User.find({ _id: { $in: ids } });
            posts.forEach(post => {
                post.files.forEach(file => {
                    file.faces?.forEach(face => {
                        if (face.userId)
                            face.user = users.find(u => u._id.equals(face.userId));
                    });
                });
            });
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
            ]).then(async posts => {
                const ids = [];
                posts.forEach(post => {
                    post.files.forEach(file => {
                        file.faces?.forEach(face => face.userId && ids.push(face.userId));
                    });
                });
                const users = await User.find({ _id: { $in: ids } });
                posts.forEach(post => {
                    post.files.forEach(file => {
                        file.faces?.forEach(face => {
                            if (face.userId)
                                face.user = users.find(u => u._id.equals(face.userId));
                        });
                    });
                });
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
            ]).then(async posts => {
                if (posts.length === 0) {
                    return res.json(null);
                }
                const post = posts[0];
                const userId = [];
                post.files.forEach(file => {
                    file.faces?.forEach(face => face.userId && userId.push(face.userId));
                });
                const users = await User.find({ _id: { $in: userId } });
                post.files.forEach(file => {
                    file.faces?.forEach(face => {
                        if (face.userId)
                            face.user = users.find(u => u._id.equals(face.userId));
                    });
                });
                res.json(post);
            }).catch(error => {
                res.status(500);
            });
        })
        .post('/', (req, res) => {
            if (!req.user) {
                return res.status(401).json({ message: 'User is not logged in' });
            }
            upload(req, res, async err => {
                if (err) {
                    return res.status(400).json(err);
                }
                try {
                    const facesInFiles = JSON.parse(req.body.faces);
                    console.log(facesInFiles.map(f => f))
                    const pPost = Post.create({
                        userId: req.user,
                        text: req.body.text,
                        files: req.files?.map((f, i) => ({
                            url: f.secure_url,
                            resourceType: f.resource_type,
                            faces: facesInFiles[i]
                        }))
                    });
                    const faces = [];
                    facesInFiles.forEach(facesInFile => {
                        facesInFile?.forEach(face => {
                            face.userId && faces.push(face);
                        });
                    });
                    const pFaces = Face.insertMany(faces);
                    const [post] = await Promise.all([pPost, pFaces]);
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
        .delete('/:_id', (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            Post.findById(req.params._id)
                .then(post => {
                    if (!post.userId.equals(mongoose.Types.ObjectId(req.user))) {
                        return res.status(403).json({ message: 'Unauthorized' });
                    }
                    return post.remove();
                })
                .then(() => {
                    res.sendStatus(200);
                })
                .catch(error => {
                    console.error(error);
                    res.sendStatus(500);
                });
        })
        .post('/report/:_id', async (req, res) => {
            if (!req.user) {
                return res.status(401).json({ message: 'User is not logged in' });
            }
            if (!req.body.reason) {
                res.status(400).json({ message: 'Reason is required' });
            }
            await ReportedPost.create({
                userId: req.user,
                postId: req.params._id,
                reason: req.body.reason
            });
            res.sendStatus(200);
        })
    return app;
}