const express = require('express');
const MessageNotification = require('../db/messageNotification');
const Notification = require('../db/notification');
const mongoose = require('mongoose');

const app = express.Router();
app
    .get('/general/count', (req, res) => {
        if (!req.user) {
            return res.sendStatus(401);
        }
        Notification.countDocuments({
            userId: req.user,
            type: { $in: ['follow', 'like', 'comment', 'reply'] },
            seen: null
        }).then(count => {
            res.json(count);
        }).catch(error => {
            res.sendStatus(500);
        });
    })
    .get('/general', (req, res) => {
        if (!req.user) {
            return res.sendStatus(401);
        }
        Notification.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(req.user),
                    type: { $in: ['follow', 'like'] }
                }
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $lookup: { from: 'users', localField: 'followerId', foreignField: '_id', as: 'follower' } },
            { $set: { follower: { $arrayElemAt: ['$follower', 0] } } },
            { $lookup: { from: 'users', localField: 'likeUserId', foreignField: '_id', as: 'likeUser' } },
            { $set: { likeUser: { $arrayElemAt: ['$likeUser', 0] } } },
        ]).then(result => {
            res.json(result);
        }).catch(error => {
            res.sendStatus(500);
        });
    })
    .get('/chat', async (req, res) => {
        const conversationIds = await MessageNotification.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(req.user) } },
            { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'message' } },
            { $unwind: '$message' },
            { $group: { _id: '$message.conversationId' } }
        ]);
        res.json(conversationIds);
    })
    .put('/chat', async (req, res) => {
        await MessageNotification.deleteMany({ userId: req.user, messageId: { $in: req.body } });
        res.sendStatus(200);
    })

module.exports = app;