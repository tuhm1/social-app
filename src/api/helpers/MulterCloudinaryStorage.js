const cloudinary = require('cloudinary').v2;

module.exports = class MulterCloudinaryStorage {
    constructor(options) {
        this.options = options;
     }
    _handleFile(req, file, cb) {
        const uploadStream = cloudinary.uploader.upload_stream(
            this.options,
            (err, res) => {
                if (err) return cb(err);
                cb(null, res);
            }
        );
        file.stream.pipe(uploadStream);
    }
    _removeFile(req, file, cb) {
        cloudinary.uploader.destroy(file.public_id, cb);
    }
}