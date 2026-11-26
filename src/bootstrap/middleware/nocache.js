import nocacheLib from "nocache";

const nocache = nocacheLib();

export const noCacheMiddleware =
  ({ publicPath } = {}) =>
  (req, res, next) => {
    if (req.path.includes(publicPath)) {
      return next();
    }

    return nocache(req, res, next);
  };
