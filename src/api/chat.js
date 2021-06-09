module.exports = io => {
    const express = require('express');
    const mongoose = require('mongoose');
    const Conversation = require('../db/conversation');
    const Message = require('../db/message');
    const MessageNotification = require('../db/messageNotification');
    const app = express.Router();
    const multer = require('multer');
    const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
    const upload = multer({
        storage: new CloudinaryStorage({
            folder: process.env.CLOUDINARY_FOLDER || 'dev',
            resource_type: 'auto'
        })
    }).array('files');
    app
        .get('/conversations', async (req, res) => {
            const conversations = await Conversation.aggregate([
                { $match: { userIds: mongoose.Types.ObjectId(req.user) } },
                { $lookup: { from: 'users', localField: 'userIds', foreignField: '_id', as: 'users' } },
                {
                    $lookup: {
                        from: 'messages', as: 'lastMessage',
                        let: { conversationId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$conversationId', '$$conversationId'] } } },
                            { $sort: { createdAt: -1 } },
                            { $limit: 1 },
                            { $lookup: { from: 'users', localField: 'senderId', foreignField: '_id', as: 'sender' } },
                            { $unwind: '$sender' }
                        ]
                    }
                },
                { $unwind: '$lastMessage' },
                { $sort: { 'lastMessage.createdAt': -1 } },
                {
                    $project: {
                        _id: 1, title: 1,
                        'users._id': 1, 'users.firstName': 1, 'users.lastName': 1, 'users.avatar': 1,
                        'lastMessage.text': 1, 'lastMessage.files': 1,
                        'lastMessage.sender.firstName': 1, 'lastMessage.sender.lastName': 1,
                        'lastMessage.createdAt': 1
                    }
                }
            ]);
            res.json(conversations);
        })
        .get('/conversations/:conversationId', async (req, res) => {
            const messages = await Message.aggregate([
                { $match: { conversationId: mongoose.Types.ObjectId(req.params.conversationId) } },
                { $lookup: { from: 'users', localField: 'senderId', foreignField: '_id', as: 'sender' } },
                { $unwind: '$sender' },
                {
                    $lookup: {
                        from: 'message_notifications', as: 'notifications',
                        let: { messageId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$userId', mongoose.Types.ObjectId(req.user)] },
                                            { $eq: ['$messageId', '$$messageId'] }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        text: 1, files: 1, createdAt: 1,
                        seen: { $eq: [{ $size: '$notifications' }, 0] },
                        'sender._id': 1, 'sender.firstName': 1, 'sender.lastName': 1, 'sender.avatar': 1
                    }
                }
            ]);
            res.json(messages);
        })
        .post('/', async (req, res) => {
            const conversation = await Conversation.create({
                userIds: [req.user, ...req.body.userIds].sort(),
                creatorId: req.user,
                title: req.body.title
            });
            res.json(conversation._id);
        })
        .post('/:conversationId', async (req, res) => {
            upload(req, res, async err => {
                if (err) {
                    res.status(400).json(err);
                }
                try {
                    const conversationId = req.params.conversationId;
                    const senderId = req.user;
                    const message = await Message.create({
                        senderId,
                        conversationId,
                        text: req.body.text,
                        files: req.files?.map(file => ({
                            url: file.secure_url,
                            resourceType: file.resource_type
                        }))
                    });
                    const { userIds } = await Conversation.findById(conversationId, { userIds: 1 }).lean();
                    await MessageNotification.insertMany(
                        userIds.filter(id => id != req.user)
                            .map(userId => ({ userId, messageId: message._id }))
                    );
                    res.sendStatus(200);
                    io.emit('message');
                } catch (error) {
                    res.status(400).json(error);
                }
            })
        })

    return app;
}