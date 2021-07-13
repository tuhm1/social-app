const express = require('express');
const { User } = require('../db/user');
const Post = require('../db/post');
const ReportedPost = require('../db/reported_post');
const app = express.Router();
app
    .get('/isadmin', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User is not logged in' });
        }
        const user = await User.findById(req.user);
        res.json(user.isAdmin === true);
    })
    .get('/users', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'User is not logged in' });
        }
        const user = await User.findOne({ _id: req.user });
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'User is not admin' });
        }
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const query = req.query.search ? { $text: { $search: req.query.search } } : {};
        if (req.query.admin === 'true') {
            query.isAdmin = { $eq: true };
        } else if (req.query.admin === 'false') {
            query.isAdmin = { $ne: true };
        }
        if (req.query.active === 'true') {
            query.deleted = { $ne: true };
        } else if (req.query.active === 'false') {
            query.deleted = { $eq: true };
        }
        const pUsers = User
            .findWithDeleted(query, { password: 0 })
            .skip((page - 1) * limit)
            .limit(limit);
        const pCount = User.countDocumentsWithDeleted(query);
        const [users, count] = await Promise.all([pUsers, pCount]);
        res.json({ users, count, isRoot: user.isRoot });
    })
    .post('/users/lock/:userId', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'User is not logged in' });
        }
        const user = await User.findOne({ _id: req.user });
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'User is not admin' });
        }
        const targetUser = await User.findOne({ _id: req.params.userId });
        await targetUser.delete();
        res.sendStatus(200);
    })
    .post('/users/unlock/:userId', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'User is not logged in' });
        }
        const user = await User.findOne({ _id: req.user });
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'User is not admin' });
        }
        const targetUser = await User.findOneWithDeleted({ _id: req.params.userId });
        await targetUser.restore();
        res.sendStatus(200);
    })
    .post('/users/admin/:userId', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'User is not logged in' });
        }
        const user = await User.findOne({ _id: req.user });
        if (!user.isRoot) {
            return res.status(403).json({ message: 'No permission' });
        }
        await User.updateOne({ _id: req.params.userId }, { isAdmin: true });
        res.sendStatus(200);
    })
    .get('/users/count', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const count = await User.countDocuments();
        res.json(count);
    })
    .get('/users/statistic', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (req.query.groupBy === 'month') {
            const result = await User.aggregate([
                {
                    $project: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    }
                },
                {
                    $group: {
                        _id: { month: '$month', year: '$year' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);
            res.json(result);
        } else {
            const result = await User.aggregate([
                { $project: { year: { $year: '$createdAt' } } },
                {
                    $group: {
                        _id: { year: '$year' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1 } }
            ]);
            res.json(result);
        }
    })
    .get('/posts/count', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const count = await Post.countDocuments();
        res.json(count);
    })
    .get('/posts/statistic', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (req.query.groupBy === 'month') {
            const result = await Post.aggregate([
                {
                    $project: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    }
                },
                {
                    $group: {
                        _id: { month: '$month', year: '$year' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);
            res.json(result);
        } else {
            const result = await User.aggregate([
                { $project: { year: { $year: '$createdAt' } } },
                {
                    $group: {
                        _id: { year: '$year' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1 } }
            ]);
            res.json(result);
        }
    })
    .get('/posts/reported', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const reported = await ReportedPost.aggregate([
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
            { $set: { user: { $arrayElemAt: ['$user', 0] } } },
            { $lookup: { from: 'posts', localField: 'postId', foreignField: '_id', as: 'post' } },
            { $set: { post: { $arrayElemAt: ['$post', 0] } } },
            { $lookup: { from: 'users', localField: 'post.userId', foreignField: '_id', as: 'post.user' } },
            { $set: { 'post.user': { $arrayElemAt: ['$post.user', 0] } } },
        ]);
        res.json(reported);
    })
    .post('/posts/reported/delete/:postId', async (req, res) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.user);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const post = await Post.findById(req.params.postId);
        await post.remove();
        res.sendStatus(200);
    })
module.exports = app;