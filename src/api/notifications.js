const express = require('express');
const Notification = require('../db/notification');
const mongoose = require('mongoose');

const app = express.Router();
app
    .get('/general', (req, res) => {
        if (!req.user) {
            return res.sendStatus(401);
        }
        Notification.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(req.user),
                    type: { $in: ['like', 'comment', 'reply', 'follow'] }
                }
            },
            { $sort: { _id: -1 } },

            { $lookup: { from: 'follows', localField: 'followId', foreignField: '_id', as: 'follow' } },
            { $set: { follow: { $arrayElemAt: ['$follow', 0] } } },
            { $lookup: { from: 'users', localField: 'follow.followerId', foreignField: '_id', as: 'follow.follower' } },
            { $set: { 'follow.follower': { $arrayElemAt: ['$follow.follower', 0] } } },

            { $lookup: { from: 'likes', localField: 'likeId', foreignField: '_id', as: 'like' } },
            { $set: { like: { $arrayElemAt: ['$like', 0] } } },
            { $lookup: { from: 'users', localField: 'like.userId', foreignField: '_id', as: 'like.user' } },
            { $set: { 'like.user': { $arrayElemAt: ['$like.user', 0] } } },

            { $lookup: { from: 'comments', localField: 'commentId', foreignField: '_id', as: 'comment' } },
            { $set: { comment: { $arrayElemAt: ['$comment', 0] } } },
            { $lookup: { from: 'users', localField: 'comment.userId', foreignField: '_id', as: 'comment.user' } },
            { $set: { 'comment.user': { $arrayElemAt: ['$comment.user', 0] } } },

            { $lookup: { from: 'comments', localField: 'replyId', foreignField: '_id', as: 'reply' } },
            { $set: { reply: { $arrayElemAt: ['$reply', 0] } } },
            { $lookup: { from: 'users', localField: 'reply.userId', foreignField: '_id', as: 'reply.user' } },
            { $set: { 'reply.user': { $arrayElemAt: ['$reply.user', 0] } } },
        ]).then(result => {
            res.json(result);
        }).catch(error => {
            res.sendStatus(500);
        });
    })
    .get('/general/count', (req, res) => {
        if (!req.user) {
            return res.sendStatus(401);
        }
        Notification.countDocuments({
            userId: req.user,
            type: { $in: ['like', 'comment', 'reply', 'follow'] },
            seen: null
        }).then(count => {
            res.json(count);
        }).catch(error => {
            res.sendStatus(500);
        });
    })
    .put('/general', async (req, res) => {
        await Notification.updateMany({ _id: { $in: req.body } }, { seen: new Date() });
        res.sendStatus(200);
    })
    .get('/chat/count', async (req, res) => {
        const result = await Notification.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(req.user), type: 'message' } },
            { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'message' } },
            { $unwind: '$message' },
            { $group: { _id: '$message.conversationId', count: { $sum: 1 } } }
        ]);
        res.json(result.length);
    })
    .get('/chat', async (req, res) => {
        const notifications = await Notification.find({ userId: req.user, type: 'message' });
        res.json(notifications);
    })
    .put('/chat', async (req, res) => {
        await Notification.deleteMany({ _id: { $in: req.body } });
        res.sendStatus(200);
    })

module.exports = app;