module.exports = io => {
    const passport = require('passport');
    const { User, GoogleUser, LocalUser } = require('../db/user');

    const { Strategy: GoogleStrategy } = require('passport-custom');
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    passport.use('google', new GoogleStrategy(async (req, done) => {
        try {
            const ticket = await client.verifyIdToken({
                idToken: req.body.idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            let user = await GoogleUser.findOne({ googleId: payload.sub });
            if (!user) {
                user = await GoogleUser.create({
                    googleId: payload.sub,
                    firstName: payload.given_name,
                    lastName: payload.family_name,
                });
            }
            done(null, user._id);
        } catch (err) {
            done(err);
        }
    }));

    const { Strategy: LocalStrategy } = require('passport-local');
    passport.use('local', new LocalStrategy(async (username, password, done) => {
        try {
            const user = await LocalUser.findOne({ username }, { _id: 1, password: 1 });
            if (!user) { return done(null, false); }
            const passwordMatch = await user.comparePassword(password);
            done(null, passwordMatch && user._id);
        } catch (err) {
            done(err);
        }
    }));

    passport.serializeUser((id, done) => done(null, id));
    passport.deserializeUser((id, done) => done(null, id));

    const express = require('express');
    const app = express.Router();
    app
        .get('/me', (req, res) => {
            res.json(req.session.userId);
        })
        .post('/logout', (req, res) => {
            const userId = req.user;
            req.logout();
            res.sendStatus(200);
            io.emit('logout', userId);
        })
        .post('/google',
            passport.authenticate('google'),
            (req, res) => {
                res.sendStatus(200);
                io.emit('login', req.user);
            }
        )
        .post('/login',
            passport.authenticate('local'),
            (req, res) => {
                res.sendStatus(200);
                io.emit('login', req.user);
            }
        )
        .post('/register', async (req, res) => {
            LocalUser.create(req.body)
                .then(user => {
                    req.login(user, err => {
                        if (err) return res.status(500).json(err);
                        res.json(user);
                        io.emit('login', req.user);
                    });
                })
                .catch(err => {
                    if (err.code === 11000)
                        res.status(400).json({ message: 'That username already exists' });
                    else if (err instanceof mongoose.Error.ValidationError)
                        res.status(400).json(err);
                    else
                        res.status(500).json(err);
                });
        });
    return app;
};