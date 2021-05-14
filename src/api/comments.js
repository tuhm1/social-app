module.exports = io => {
    const express = require('express');
    const Comment = require('../db/comment');
    const mongoose = require('mongoose');
    const app = express.Router();
    app
        .get('/', async (req, res) => {
            const { postId, replyTo } = req.query;
            if (replyTo) {
                const data = await Comment.aggregate([
                    { $match: { _id: mongoose.Types.ObjectId(replyTo) } },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                    {
                        $lookup: {
                            from: 'comments', let: { replyTo: '$_id' }, as: 'replies',
                            pipeline: [
                                { $match: { $expr: { $eq: ['$replyTo', '$$replyTo'] } } },
                                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                                { $lookup: { from: 'comments', localField: '_id', foreignField: 'replyTo', as: 'replies' } },
                                {
                                    $set: {
                                        user: { $arrayElemAt: ['$users', 0] },
                                        repliesCount: { $size: '$replies' }
                                    }
                                }
                            ]
                        }
                    },
                    { $set: { user: { $arrayElemAt: ['$users', 0] } } },
                    {
                        $project: {
                            text: 1, replyTo: 1, 'user.firstName': 1, 'user.lastName': 1, 'user.avatar': 1, 'user._id': 1,
                            'replies._id': 1, 'replies.text': 1, 'replies.repliesCount': 1,
                            'replies.user._id': 1, 'replies.user.firstName': 1, 'replies.user.lastName': 1, 'replies.user.avatar': 1,
                        }
                    }
                ]);
                res.json(data);
            } else {
                const data = await Comment.aggregate([
                    { $match: { postId: mongoose.Types.ObjectId(postId), replyTo: null } },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
                    { $lookup: { from: 'comments', localField: '_id', foreignField: 'replyTo', as: 'replies' } },
                    { $set: { user: { $arrayElemAt: ['$users', 0] } } },
                    {
                        $project: {
                            text: 1, 'user.firstName': 1, 'user.lastName': 1, 'user.avatar': 1, 'user._id': 1,
                            repliesCount: { $size: '$replies' }
                        }
                    }
                ]);
                res.json(data);
            }
        })
        .post('/', async (req, res) => {
            try {
                const comment = await Comment.create({
                    postId: req.body.postId,
                    replyTo: req.body.replyTo,
                    userId: req.user,
                    text: req.body.text
                });
                res.sendStatus(200);
                io.emit('comment', comment);
            } catch (err) {
                if (err instanceof mongoose.Error.ValidationError)
                    res.status(400).json(err);
                else
                    res.status(500).json(err);
            }
        })
    return app;
}