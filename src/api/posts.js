const express = require('express');
const app = express.Router();

const Post = require('../db/post');

const multer = require('multer');
const CloudinaryStorage = require('./helpers/MulterCloudinaryStorage');
const upload = multer({
    storage: new CloudinaryStorage({
        folder: process.env.CLOUDINARY_FOLDER || 'dev',
        resource_type: 'auto'
    })
}).array('files');

app
    .post('/', (req, res) => {
        upload(req, res, async err => {
            if (err) {
                res.status(400).json(err);
            }
            try {
                const post = await Post.create({
                    userId: req.user,
                    text: req.body.text,
                    files: req.files?.map(f => ({
                        url: f.secure_url,
                        resourceType: f.resource_type
                    }))
                });
                res.json(post);
            } catch (error) {
                res.status(400).json(error);
            }
        });
    });

module.exports = app;