
module.exports = io => {
    const express = require('express');
    const app = express();
    const Like = require('../db/like');
    const Notification = require('../db/notification');
    const Post = require('../db/post');
    const mongoose = require('mongoose');

    app.post('/:postId', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'You are not logged in' });
        }
        const postId = mongoose.Types.ObjectId(req.params.postId);
        const userId = mongoose.Types.ObjectId(req.user);
        const pLike = Like.create({ postId, userId });
        pLike.then(() => res.sendStatus(200))
            .catch(error => res.status(400).json(error));
        const pPost = Post.findById(postId);
        const [like, post] = await Promise.all([pLike, pPost]);
        if (userId.equals(post.userId)) return;
        const notification = await Notification.create({
            userId: post.userId,
            type: 'like',
            likeId: like._id
        });
        io.to(post.userId).emit('notification', notification);
    }).delete('/:postId', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'You are not logged in' });
        }
        try {
            const like = await Like.findOne({
                postId: req.params.postId,
                userId: req.user
            });
            await like.remove();
            res.sendStatus(200);
        } catch (error) {
            res.status(400).json(error);
        }
    });

    return app;
};