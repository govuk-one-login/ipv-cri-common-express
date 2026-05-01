import type { Request, Response, NextFunction } from "express";

const middleware =
  ({ pageNotFoundView = "errors/page-not-found" } = {}) =>
  (_req: Request, _res: Response, next: NextFunction) => {
    const err = new Error("Page not found");
    err.code = "PAGE_NOT_FOUND";
    err.template = pageNotFoundView;
    err.status = 404;
    next(err);
  };

export {
  middleware
};
