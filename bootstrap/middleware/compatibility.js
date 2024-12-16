const middleware = () => (req, res, next) => {
    res.setHeader('X-UA-Compatible', 'IE=edge,chrome=1');
    next();
};

module.exports = {
    middleware
};
