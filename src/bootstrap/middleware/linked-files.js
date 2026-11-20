import debugLib from "debug";
import { getRedisClient } from "../lib/redis-client";
import onFinished from "on-finished";
import { add, del, get } from "./linked-files-utils.js";

const debug = debugLib("hmpo:linked-files");

// redis records are stored as the uuid prefixed with this:
const PREFIX = "file:";

export const linkedFilesMiddleware =
  ({ ttl = 30000 } = {}) =>
  (req, res, next) => {
    req.linkedFiles = {
      add: (...args) => add(req, ttl, ...args),
      get: (...args) => get(req, ...args),
      del: (...args) => del(req, ...args),
    };

    onFinished(res, () => {
      if (!req.session) return;
      let ids = Object.keys(req.session.linkedFiles || {});
      if (ids.length) {
        let client = getRedisClient();
        debug("Updated expiry date on linked files", ids);
        ids.forEach((id) => client.expire(PREFIX + id, ttl));
      }
    });

    next();
  };
