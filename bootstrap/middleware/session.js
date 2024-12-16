const expressSession = require('express-session');
const redisClient = require('../lib/redis-client');

const middleware = ({
    cookieName = 'hmpo.sid',
    secret = 'not-secret',
    ttl = 30000,
    sessionStore,
    cookieOptions = {}
} = {}) => {
    if (!sessionStore) {
        const RedisStore = require('connect-redis')(expressSession);
        sessionStore = new RedisStore({
            client: redisClient.getClient(),
            ttl
        });
    }

    const session = expressSession({
        store: sessionStore,
        cookie: {
            secure: 'auto',
            ...cookieOptions
        },
        key: cookieName,
        secret: secret,
        resave: true,
        saveUninitialized: true
    });

    return [
        session,
        (req, res, next) => {
            req.isNewBrowser = !req.cookies[cookieName];
            req.session['start-time'] = req.session['start-time'] || Date.now();
            res.locals.sessionid = req.sessionID;
            req.sessionTTL = ttl;
            res.locals.sessionTTL = ttl;
            next();
        }
    ];
};

module.exports = {
    middleware
};
