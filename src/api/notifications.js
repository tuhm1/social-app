const express = require('express');
const MessageNotification = require('../db/messageNotification');
const mongoose = require('mongoose');

const app = express.Router();
app
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