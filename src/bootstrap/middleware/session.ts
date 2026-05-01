import type { Request, Response, NextFunction } from "express";
import type { CookieOptions, Store } from "express-session";

import expressSession from "express-session";
import * as redisClient from "../lib/redis-client";
import RedisStore from "connect-redis";

interface MiddlewareOptions {
  cookieName?: string;
  secret?: string;
  ttl?: number;
  sessionStore?: Store;
  cookieOptions?: CookieOptions;
}

const middleware = ({
  cookieName = "hmpo.sid",
  secret = "not-secret",
  ttl = 30000,
  sessionStore,
  cookieOptions = {},
}: MiddlewareOptions = {}) => {
  let store: Store | undefined = sessionStore;
  if (!store) {
    store = new RedisStore({
      client: redisClient.getClient()!,
      ttl,
    });
  }

  const session = expressSession({
    store,
    cookie: {
      secure: "auto",
      ...cookieOptions,
    },
    name: cookieName,
    secret,
    resave: true,
    saveUninitialized: true,
  });

  return [
    session,
    (req: Request, res: Response, next: NextFunction) => {
      req.isNewBrowser = !req.cookies[cookieName];
      req.session["start-time"] = req.session["start-time"] || Date.now();
      res.locals.sessionid = req.sessionID;
      req.sessionTTL = ttl;
      res.locals.sessionTTL = ttl;
      next();
    },
  ];
};

export { middleware };
