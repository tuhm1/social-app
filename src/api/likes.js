module.exports = io => {
    const express = require('express');
    const app = express();
    const Like = require('../db/like');

    app.post('/:postId', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'You are not logged in' });
        }
        try {
            const postId = req.params.postId;
            const userId = req.user;
            const like = await Like.updateOne(
                { postId, userId },
                { postId, userId },
                { upsert: true }
            );
            res.sendStatus(200);
            io.emit('like', like);
        } catch (error) {
            res.status(400).json(error);
        }
    }).delete('/:postId', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'You are not logged in' });
        }
        try {
            await Like.deleteOne({
                postId: req.params.postId,
                userId: req.user
            });
            res.sendStatus(200);
            io.emit('unlike', req.params.postId);
        } catch (error) {
            res.status(400).json(error);
        }
    });

    return app;
};