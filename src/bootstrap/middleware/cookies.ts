import type { Request, Response, NextFunction, CookieOptions } from "express";

import cookieParser from "cookie-parser";

const middleware = ({ secret }: { secret?: string } = {}) => [
  cookieParser(secret),
  (req: Request, res: Response, next: NextFunction) => {
    const cookie = res.cookie as (
      name: string,
      val: unknown,
      options?: CookieOptions,
    ) => void;
    res.cookie = ((name: string, value: unknown, options?: CookieOptions) => {
      options = options || {};
      options.secure = req.protocol === "https";
      options.httpOnly = true;
      options.path = "/";
      cookie.call(res, name, value, options);
    }) as typeof res.cookie;
    next();
  },
];

export { middleware };
