import { describe, vi, it, afterEach, beforeEach, expect } from "vitest";

const session = require(APP_ROOT + "/src/bootstrap/middleware/session");
const redisClient = require(APP_ROOT + "/src/bootstrap/lib/redis-client");

describe("Session", () => {
  let redisStub;

  beforeEach(() => {
    redisStub = {
      on: vi.fn(),
    };
    vi.spyOn(redisClient, "getClient").mockReturnValue(redisStub);
  });

  afterEach(() => {
    redisClient.getClient.mockRestore();
  });

  it("exports an object of middleware", () => {
    expect(typeof session).toBe("object");
  });

  describe("session middleware", () => {
    it("should get the redis client", () => {
      session.middleware();
      expect(redisClient.getClient).toHaveBeenCalledTimes(1);
    });

    it("should not create a redis session store if a store is specified", () => {
      const sessionStore = {
        on: vi.fn(),
      };
      session.middleware({ sessionStore });
      expect(redisClient.getClient).not.toHaveBeenCalled();
    });

    it("should return a new session store", () => {
      const middleware = session.middleware();
      expect(typeof middleware[0]).toBe("function");
    });
  });

  describe("session locals", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        session: {},
        cookies: {},
        sessionID: "abc123",
      };
      res = {
        locals: {},
      };
      next = vi.fn();
      vi.useFakeTimers();
      vi.setSystemTime(1234567890);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should be a middleware function", () => {
      expect(typeof session.middleware()[1]).toBe("function");
      expect(session.middleware()[1]).toHaveLength(3);
    });

    it("should set new browser flag to true if no sesssion cookie exists", () => {
      session.middleware()[1](req, res, next);

      expect(req.isNewBrowser).toBe(true);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should set new browser flag to false if there is a session cookie", () => {
      req.cookies["hmpo.sid"] = "foobar";

      session.middleware()[1](req, res, next);

      expect(req.isNewBrowser).toBe(false);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should set the session start time", () => {
      session.middleware()[1](req, res, next);
      expect(req.session["start-time"]).toEqual(1234567890);
    });

    it("should set not overwrite an existing session start time", () => {
      req.session["start-time"] = 987654321;
      session.middleware()[1](req, res, next);
      expect(req.session["start-time"]).toEqual(987654321);
    });

    it("should set the session id to locals", () => {
      session.middleware()[1](req, res, next);
      expect(res.locals.sessionid).toEqual("abc123");
    });
  });
});
