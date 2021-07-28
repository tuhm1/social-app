const express = require('express');
const Face = require('../db/face');

const app = express.Router();
app
    .get('/', async (req, res) => {
        const faces = await Face.aggregate([
            {
                $group: {
                    _id: '$userId',
                    descriptors: { $push: '$descriptor' }
                }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $set: { user: { $arrayElemAt: ['$user', 0] } } }
        ]);
        res.json(faces);
    })
module.exports = app;