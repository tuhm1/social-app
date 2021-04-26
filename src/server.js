const express = require('express');
const next = require('next');
const morgan = require('morgan');
const expressHandler = express();
const nextHandler = next({});

(async () => {
    await nextHandler.prepare();
    expressHandler
        .use(morgan('dev'))
        .get('/api', (req, res) => res.json({ message: 'Hello' }))
        .use((req, res) => nextHandler.getRequestHandler()(req, res))
        .listen(3000);
})();