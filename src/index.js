const passport = require('passport');

(async () => {
    const Express = require('express');
    const express = Express();

    const mongoose = require('mongoose');
    mongoose.set('debug', true);
    await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    express.set('dbContext', { 
        ...require('./db/user'),
        Post: require('./db/post'),
        Like: require('./db/like')
    });

    const server = require('http').createServer(express);
    const io = require('socket.io')(server);

    express
        .use(require('morgan')('dev'))
        .use(Express.json())
        .use(require('express-session')({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: true
        }))
        .use(passport.initialize())
        .use(passport.session())
        .use('/api/auth', require('./api/auth')(io))
        .use('/api/user', require('./api/users')(io))
        .use('/api/post', require('./api/posts')(io))
        .use('/api/likes', require('./api/likes')(io))
        .use('/api/comments', require('./api/comments')(io))
    const next = require('next')({ dev: process.env.NODE_ENV !== 'production' });
    await next.prepare();
    express.use((req, res) => next.getRequestHandler()(req, res))


    server.listen(3000, () => {
        console.log('Server listening in port 3000...');
    });
})();