const cookieParser = require('cookie-parser');

const middleware = ({ secret } = {}) => [
    cookieParser(secret),
    (req, res, next) => {
        const cookie = res.cookie;
        res.cookie = (name, value, options) => {
            options = options || {};
            options.secure = (req.protocol === 'https');
            options.httpOnly = true;
            options.path = '/';
            cookie.call(res, name, value, options);
        };
        next();
    }
];

module.exports = {
    middleware
};
