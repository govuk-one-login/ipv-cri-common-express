import deepCloneMerge from "deep-clone-merge";

export const featureFlagMiddleware =
  ({ featureFlags } = {}) =>
  (req, res, next) => {
    req.featureFlags = deepCloneMerge.extend(
      req.featureFlags || {},
      featureFlags,
      req.session?.featureFlags,
    );
    res.locals.featureFlags = req.featureFlags;
    next();
  };

export const getFlags = (req) => req.featureFlags || {};

export const isFlagEnabled = (flag, req) => getFlags(req)[flag] === true;

export const isFlagDisabled = (flag, req) => !isFlagEnabled(flag, req);

export const redirectIfFlagEnabled = (flag, url) => (req, res, next) => {
  if (isFlagEnabled(flag, req)) {
    return res.redirect(url);
  }
  next();
};

export const redirectIfFlagDisabled = (flag, url) => (req, res, next) => {
  if (isFlagDisabled(flag, req)) {
    return res.redirect(url);
  }
  next();
};

export const routeIfFlagEnabled =
  (flag, handlerIf, handlerElse) => (req, res, next) => {
    if (isFlagEnabled(flag, req)) {
      handlerIf(req, res, next);
    } else {
      handlerElse(req, res, next);
    }
  };
