import type { Request, Response, NextFunction } from "express";
import createDebug from "debug";
import * as redis from "../lib/redis-client";
import onFinished from "on-finished";
import * as uuid from "../lib/uuid";
import async from "async";

const debug = createDebug("hmpo:linked-files");

// redis records are stored as the uuid prefixed with this:
const PREFIX = "file:";

type Callback<T = unknown> = (err: Error | null, result?: T) => void;

// TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

interface SessionInjectionLike {
  middlewareDecodePayload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void;
}

// the value is prefixed with J:, B:, or S: to indicate JSON, Buffer, or String
function stringify(data: unknown): string {
  if (typeof data === "string") return "S:" + data;
  if (Buffer.isBuffer(data)) return "B:" + data.toString("base64");
  return "J:" + JSON.stringify(data as string);
}

function parse(data: string, cb: Callback): void {
  let result: string | Buffer | unknown;
  try {
    const type = data.charAt(0);
    result = data.slice(2);
    if (type === "B") result = Buffer.from(result as string, "base64");
    if (type === "J") result = JSON.parse(result as string);
  } catch (e) {
    return cb(e as Error);
  }
  cb(null, result);
}

const middleware =
  ({ ttl = 30000 } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.linkedFiles = {
      add: (...args) => add(req, ttl, ...args),
      get: (...args) => get(req, ...args),
      del: (...args) => del(req, ...args),
    };

    onFinished(res, () => {
      if (!req.session) return;
      const ids = Object.keys(req.session.linkedFiles || {});
      if (ids.length) {
        const client = redis.getClient();
        debug("Updated expiry date on linked files", ids);
        ids.forEach((id) => client!.expire(PREFIX + id, ttl));
      }
    });

    next();
  };

const injection = <T extends Constructor<SessionInjectionLike>>(
  SessionInjection: T,
) => {
  if (!SessionInjection.prototype.middlewareDecodePayload) {
    throw new Error("SessionInjection base class expected");
  }
  return class SessionInjectionWithLinkedFiles extends SessionInjection {
    middlewareDecodePayload(req: Request, res: Response, next: NextFunction) {
      super.middlewareDecodePayload(req, res, (err?: unknown) => {
        if (err) return next(err);

        if (!req.payload?.files) return next();

        req.payload.journeyKeys = req.payload.journeyKeys || {};

        const files = req.payload.files;
        delete req.payload.files;

        async.forEachOf(
          files,
          (file, key, done) => {
            req.linkedFiles!.add(file, (err: Error | null, id?: string) => {
              if (err) return done(err);
              req.payload!.journeyKeys[key as string] = id!;
              done();
            });
          },
          (err) => next(err),
        );
      });
    }
  };
};

const add = (
  req: Request,
  ttl: number,
  data: unknown,
  cb: Callback<string>,
) => {
  const id = uuid.v4();
  const payload = stringify(data);
  redis
    .getClient()!
    .setEx(PREFIX + id, ttl, payload)
    .then(() => {
      req.session.linkedFiles = req.session.linkedFiles || {};
      req.session.linkedFiles[id] = true;
      debug("Linked file added:", id, payload.length);
      cb(null, id);
    })
    .catch((err: Error) => cb(err));
};

// should only be used when there is no access to the session to check ownership of the file
const getNoCheck = (id: string, cb: Callback) => {
  debug("Getting linked file:", id);
  redis
    .getClient()!
    .get(PREFIX + id)
    .then((data) => {
      if (data === null) return cb(null, null);
      parse(data, cb);
    })
    .catch((err: Error) => cb(err));
};

const get = (req: Request, id: string, cb: Callback) => {
  if (!req.session.linkedFiles?.[id]) {
    return cb(new Error("Linked file id not found " + id));
  }
  getNoCheck(id, cb);
};

const del = (req: Request, id: string, cb: Callback<void>) => {
  if (!req.session.linkedFiles?.[id]) {
    return cb(new Error("Linked file id not found " + id));
  }
  debug("Linked file deleted:", id);
  delete req.session.linkedFiles[id];
  redis
    .getClient()!
    .del(PREFIX + id)
    .then(() => cb(null))
    .catch((err: Error) => cb(err));
};
export { middleware, injection, add, getNoCheck, get, del };
