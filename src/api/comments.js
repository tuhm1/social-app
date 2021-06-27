module.exports = io => {
    const express = require('express');
    const Comment = require('../db/comment');
    const Post = require('../db/post');
    const Notification = require('../db/notification');
    const mongoose = require('mongoose');
    const app = express.Router();
    app
        .get('/post/:postId', async (req, res) => {
            const data = await Comment.aggregate([
                { $match: { postId: mongoose.Types.ObjectId(req.params.postId), replyTo: null } },
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
        })
        .get('/comment/:commentId', async (req, res) => {
            const data = await Comment.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params.commentId) } },
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
        })
        .post('/:postId', async (req, res) => {
            if (!req.user) {
                return res.status(400).json({ message: 'user not logged in' });
            }
            const userId = mongoose.Types.ObjectId(req.user);
            const postId = mongoose.Types.ObjectId(req.params.postId);
            const replyTo = req.body.replyTo && mongoose.Types.ObjectId(req.body.replyTo);
            const pComment = Comment.create({
                postId,
                replyTo,
                userId,
                text: req.body.text
            });
            pComment.then(() => res.sendStatus(200))
                .catch(err => {
                    if (err instanceof mongoose.Error.ValidationError)
                        res.status(400).json(err);
                    else
                        res.status(500).json(err);
                });

            if (!replyTo) {
                const pPost = Post.findById(postId);
                const [post, comment] = await Promise.all([pPost, pComment]);
                if (post.userId.equals(userId)) return;
                const notification = await Notification.create({
                    userId: post.userId,
                    type: 'comment',
                    commentId: comment._id,
                });
                io.to(post.userId).emit('notification', notification);
            } else {
                const pTargetComment = Comment.findById(replyTo);
                const [target, reply] = await Promise.all([pTargetComment, pComment]);
                if (target.userId.equals(userId)) return;
                const notification = await Notification.create({
                    userId: target.userId,
                    type: 'reply',
                    replyId: reply._id
                });
                io.to(target.userId).emit('notification', notification);
            }
        })
        .put('/:commentId', (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            if (!req.body.text) {
                return res.status(400).json({ message: 'Comment text required' });
            }
            Comment.findById(req.params.commentId)
                .then(comment => {
                    if (!comment.userId.equals(mongoose.Types.ObjectId(req.user))) {
                        return res.status(403).json({ message: 'Unauthorized' });
                    }
                    comment.text = req.body.text;
                    return comment.save();
                }).then(comment => {
                    res.json(comment);
                }).catch(error => {
                    res.sendStatus(500);
                });
        })
        .delete('/:commentId', (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            Comment.findById(req.params.commentId)
                .then(comment => {
                    if (!comment.userId.equals(mongoose.Types.ObjectId(req.user))) {
                        return res.status(403).json({ message: 'Unauthorized' });
                    }
                    return comment.remove();
                }).then(() => {
                    res.sendStatus(200);
                }).catch(error => {
                    res.sendStatus(500);
                });
        })
    return app;
}