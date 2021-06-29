module.exports = io => {
    const express = require('express');
    const Follow = require('../db/follow');
    const Notification = require('../db/notification');
    const app = express();
    const mongoose = require('mongoose');

    app
        .post('/:followingId', async (req, res) => {
            if (!req.user) {
                res.status(401).json({message: 'User is not logged in'});
            }
            try {
                const followerId = req.user;
                const followingId = req.params.followingId;
                const follow = await Follow.create({ followerId, followingId });
                res.sendStatus(200);
                const notification = await Notification.create({
                    userId: followingId,
                    type: 'follow',
                    followId: follow._id
                });
                io.to(followerId).emit('notification', notification);
            } catch (err) {
                if (err instanceof mongoose.Error.ValidationError) {
                    res.status(400).json(err);
                } else {
                    res.status(500).json(err);
                }
            }
        })
        .delete('/:followingId', async (req, res) => {
            try {
                const followingId = req.params.followingId;
                const followerId = req.user;
                const follow = await Follow.findOne({ followingId, followerId });
                await follow.remove();
                res.sendStatus(200);
            } catch (err) {
                if (err instanceof mongoose.Error.ValidationError) {
                    res.status(400).json(err);
                } else {
                    res.status(500).json(err);
                }
            }
        });
    return app;
}