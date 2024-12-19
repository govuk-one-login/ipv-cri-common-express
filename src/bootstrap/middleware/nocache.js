const nocache = require('nocache')();

const middleware = ({
    publicPath
} = {}) => (req, res, next) => {
    if (req.path.indexOf(publicPath) >= 0) {
        return next();
    }

    return nocache(req, res, next);
};

module.exports = {
    middleware
};
