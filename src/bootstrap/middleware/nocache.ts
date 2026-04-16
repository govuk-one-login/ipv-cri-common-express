import type { Request, Response, NextFunction } from "express";
import nocacheLib from "nocache";

const nocache = nocacheLib();

const middleware =
  ({ publicPath }: { publicPath?: string } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (publicPath && req.path.indexOf(publicPath) >= 0) {
      return next();
    }

    return nocache(req, res, next);
  };

export { middleware };
