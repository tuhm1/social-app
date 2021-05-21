module.exports = io => {
    const express = require('express');
    const Follow = require('../db/follow');
    const app = express();
    const mongoose = require('mongoose');

    app
        .post('/:followingId', async (req, res) => {
            try {
                const follow = await Follow.create({
                    followerId: req.user,
                    followingId: req.params.followingId
                });
                res.sendStatus(200);
                io.emit('follow/create', follow);
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
                await Follow.deleteOne({ followingId, followerId });
                io.emit('follow/delete', { followerId, followingId });
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