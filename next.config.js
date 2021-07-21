module.exports = {
    env: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
    },
    webpack: (config, { isServer }) => {
        // Fixes npm packages that depend on `fs` module
        if (!isServer) {
            config.node = {
                fs: 'empty'
            }
        }
        return config
    }
};