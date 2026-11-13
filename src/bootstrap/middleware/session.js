import expressSession from "express-session";
import { getRedisClient } from "../lib/redis-client.js";
import connectRedis from "connect-redis";

export const sessionMiddleware = ({
  cookieName = "hmpo.sid",
  secret = "not-secret",
  ttl = 30000,
  sessionStore,
  cookieOptions = {},
} = {}) => {
  if (!sessionStore) {
    const RedisStore = connectRedis(expressSession);
    sessionStore = new RedisStore({
      client: getRedisClient(),
      ttl,
    });
  }

  const session = expressSession({
    store: sessionStore,
    cookie: {
      secure: "auto",
      ...cookieOptions,
    },
    key: cookieName,
    secret: secret,
    resave: true,
    saveUninitialized: true,
  });

  return [
    session,
    (req, res, next) => {
      req.isNewBrowser = !req.cookies[cookieName];
      req.session["start-time"] = req.session["start-time"] || Date.now();
      res.locals.sessionid = req.sessionID;
      req.sessionTTL = ttl;
      res.locals.sessionTTL = ttl;
      next();
    },
  ];
};
