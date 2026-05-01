import type { Request, Response, NextFunction, RequestHandler } from "express";
// @ts-expect-error no types
import deepCloneMerge from "deep-clone-merge";

const middleware =
  ({ featureFlags }: { featureFlags?: Record<string, boolean> } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.featureFlags = deepCloneMerge.extend(
      req.featureFlags || {},
      featureFlags,
      req.session?.featureFlags,
    );
    res.locals.featureFlags = req.featureFlags;
    next();
  };

const getFlags = (req: Request) => req.featureFlags || {};

const isEnabled = (flag: string, req: Request) => getFlags(req)[flag];

const isDisabled = (flag: string, req: Request) => !isEnabled(flag, req);

const redirectIfEnabled = (flag: string, url: string) => (req: Request, res: Response, next: NextFunction) => {
  if (isEnabled(flag, req)) {
    return res.redirect(url);
  }
  next();
};

const redirectIfDisabled =
  (flag: string, url: string) => (req: Request, res: Response, next: NextFunction) => {
    if (isDisabled(flag, req)) {
      return res.redirect(url);
    }
    next();
  };

const routeIf =
  (flag: string, handlerIf: RequestHandler, handlerElse: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (isEnabled(flag, req)) {
      handlerIf(req, res, next);
    } else {
      handlerElse(req, res, next);
    }
  };

export {
  middleware,
  getFlags,
  isEnabled,
  isDisabled,
  redirectIfEnabled,
  redirectIfDisabled,
  routeIf,
};
