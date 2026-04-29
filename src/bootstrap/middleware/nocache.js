const nocache = require("nocache")();

const middleware =
  ({ publicPath } = {}) =>
  (req, res, next) => {
    if (req.path.includes(publicPath)) {
      return next();
    }

    return nocache(req, res, next);
  };

module.exports = {
  middleware,
};
