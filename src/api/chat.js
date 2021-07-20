module.exports = io => {
    const express = require('express');
    const mongoose = require('mongoose');
    const { User } = require('../db/user');
    const Conversation = require('../db/conversation');
    const Message = require('../db/message');
    const Notification = require('../db/notification');
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
        .post('/delete-member', async (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'User is not logged in' });
            }
            const { conversationId, userId } = req.body;
            console.log(req.body)
            const conversation = await Conversation.findById(conversationId);
            const currentUserId = mongoose.Types.ObjectId(req.user);
            if (!currentUserId.equals(conversation.creatorId)) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            console.log(conversation)
            conversation.userIds = conversation.userIds.filter(id => !id.equals(mongoose.Types.ObjectId(userId)));
            await conversation.save();
            res.sendStatus(200);
        })
        .post('/add-member', async (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'User is not logged in' });
            }
            const { conversationId, userId } = req.body;
            console.log(req.body)
            const conversation = await Conversation.findById(conversationId);
            const currentUserId = mongoose.Types.ObjectId(req.user);
            if (!currentUserId.equals(conversation.creatorId)) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            conversation.userIds = [...conversation.userIds, mongoose.Types.ObjectId(userId)];
            console.log(conversation)
            await conversation.save();
            res.sendStatus(200);
        })
        .get('/conversations', async (req, res) => {
            const pConversations = Conversation.aggregate([
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
            const pNotifications = await Notification.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(req.user), type: 'message' } },
                { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'message' } },
                { $unwind: '$message' },
                { $group: { _id: '$message.conversationId', count: { $sum: 1 } } }
            ]);
            const [conversations, notifications] = await Promise.all([pConversations, pNotifications]);
            conversations.forEach(c =>
                c.newsCount = notifications.find(n => n._id.equals(c._id))?.count
            );
            res.json(conversations);
        })
        .get('/conversations/:conversationId', async (req, res) => {
            const messages = await Message.aggregate([
                { $match: { conversationId: mongoose.Types.ObjectId(req.params.conversationId) } },
                { $lookup: { from: 'users', localField: 'senderId', foreignField: '_id', as: 'sender' } },
                { $unwind: '$sender' },
                {
                    $project: {
                        text: 1, files: 1, createdAt: 1,
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
                    res.sendStatus(200);
                    const { userIds } = await Conversation.findById(conversationId, { userIds: 1 }).lean();
                    await Notification.insertMany(
                        userIds.filter(id => id != req.user)
                            .map(userId => ({ userId, type: 'message', messageId: message._id }))
                    );
                    io.emit('message');
                } catch (error) {
                    res.status(400).json(error);
                }
            })
        })
        .get('/members/:conversationId', async (req, res) => {
            if (!req.user) {
                return res.status(403).json({ message: 'User is not logged in' });
            }
            const conversations = await Conversation.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.params.conversationId) } },
                { $lookup: { from: 'users', localField: 'userIds', foreignField: '_id', as: 'users' } }
            ]);
            res.json({ ...conversations[0], currentUserId: req.user });
        })

    return app;
}