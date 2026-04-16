import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  code?: string;
  status?: number;
  redirect?: string;
  template?: string;
}

type UrlResolver =
  | string
  | ((err: AppError, req: Request, res: Response) => string);

const middleware =
  ({
    startUrl = "/",
    sessionEndedView = "errors/session-ended",
    defaultErrorView = "errors/error",
  } = {}) =>
  (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const urlFn = (url: UrlResolver) =>
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

    if (res.finished || res.headersSent) {
      const logger = require("../lib/logger").get();
      return logger.error(
        "Error after response: :clientip :verb :request :err.message",
        { req: req, err: err },
      );
    }

    if (err.redirect) {
      if (
        req.method === "POST" ||
        req.path.replace(/\/+$/, "") !== err.redirect
      ) {
        return res.redirect(err.redirect);
      }
    }

    if (!err.template) {
      err.template = defaultErrorView;
      const logger = require("../lib/logger").get();
      logger.error(":clientip :verb :request :err.message", { req, err });
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

export {
  middleware,
}
