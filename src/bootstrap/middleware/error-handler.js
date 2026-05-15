const logger = require("../lib/logger");

const middleware =
  ({
    startUrl = "/",
    sessionEndedView = "errors/session-ended",
    defaultErrorView = "errors/error",
  } = {}) =>
  (err, req, res, next) => {
    const urlFn = (url) =>
      typeof url === "function" ? url(err, req, res) : url;

    let backLink = req.method === "POST" ? req.path : res.locals.backLink;

    if (err.code === "MISSING_PREREQ") {
      err.status = err.status || 403;
      if (!err.redirect && !err.template) {
        err.redirect = urlFn(startUrl);
      }
    }

    if (err.code === "SESSION_TIMEOUT") {
      err.status = err.status || 403;
      if (req.isNewBrowser && !err.redirect && !err.template) {
        err.redirect = urlFn(startUrl);
      }
      err.template = err.template || sessionEndedView;
      backLink = null;
    }

    if (err.code === "MISSING_AUTHPARAMS") {
      err.status = err.status || 403;
    }

    if (res.finished || res._headerSent) {
      return logger.logError(req, err, {
        messagePrefix: "Error after response",
      });
    }

    if (err.redirect) {
      if (
        req.method === "POST" ||
        req.path.replace(/\/+$/, "") !== err.redirect
      ) {
        if (req.session?.save) {
          return req.session.save((saveErr) => {
            if (saveErr) {
              logger.logError(req, saveErr, {
                messagePrefix: "Error saving session before redirect",
              });
            }
            res.redirect(err.redirect);
          });
        }
        return res.redirect(err.redirect);
      }
    }

    if (!err.template) {
      err.template = defaultErrorView;
      logger.logError(req, err);
    }

    err.status = err.status || 500;

    res.statusCode = err.status;
    res.err = err;

    res.render(err.template, {
      error: err,
      showStack: req.app.get("dev"),
      backLink: backLink,
    });
  };

module.exports = {
  middleware,
};
