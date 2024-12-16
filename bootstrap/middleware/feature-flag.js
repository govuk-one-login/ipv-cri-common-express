const deepCloneMerge = require('deep-clone-merge');

const middleware = ({
    featureFlags
} = {}) => (req, res, next) => {
    req.featureFlags = deepCloneMerge.extend(
        req.featureFlags || {},
        featureFlags,
        req.session && req.session.featureFlags
    );
    res.locals.featureFlags = req.featureFlags;
    next();
};

const getFlags = (req) => req.featureFlags || {};

const isEnabled = (flag, req) => getFlags(req)[flag] === true;

const isDisabled = (flag, req) => !isEnabled(flag, req);

const redirectIfEnabled = (flag, url) => (req, res, next) => {
    if (isEnabled(flag, req)) {
        return res.redirect(url);
    }
    next();
};

const redirectIfDisabled = (flag, url) => (req, res, next) => {
    if (isDisabled(flag, req)) {
        return res.redirect(url);
    }
    next();
};

const routeIf = (flag, handlerIf, handlerElse) => (req, res, next) => {
    if (isEnabled(flag, req)) {
        handlerIf(req, res, next);
    } else {
        handlerElse(req, res, next);
    }
};

module.exports = {
    middleware,
    getFlags,
    isEnabled,
    isDisabled,
    redirectIfEnabled,
    redirectIfDisabled,
    routeIf
};
