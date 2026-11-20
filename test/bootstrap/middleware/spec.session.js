import { describe, vi, it, afterEach, beforeEach, expect } from "vitest";
import { sessionMiddleware } from "../../../src/bootstrap/middleware/session.js";
vi.mock("../../../src/bootstrap/lib/redis-client.js", () => ({
  getRedisClient: vi.fn().mockReturnValue({ on: vi.fn() }),
}));

describe("Session", () => {
  beforeEach(() => {});

  describe("session middleware", () => {
    it("should return a new session store", () => {
      const middleware = sessionMiddleware();
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
      expect(typeof sessionMiddleware()[1]).toBe("function");
      expect(sessionMiddleware()[1]).toHaveLength(3);
    });

    it("should set new browser flag to true if no sesssion cookie exists", () => {
      sessionMiddleware()[1](req, res, next);

      expect(req.isNewBrowser).toBe(true);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should set new browser flag to false if there is a session cookie", () => {
      req.cookies["hmpo.sid"] = "foobar";

      sessionMiddleware()[1](req, res, next);

      expect(req.isNewBrowser).toBe(false);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should set the session start time", () => {
      sessionMiddleware()[1](req, res, next);
      expect(req.session["start-time"]).toEqual(1234567890);
    });

    it("should set not overwrite an existing session start time", () => {
      req.session["start-time"] = 987654321;
      sessionMiddleware()[1](req, res, next);
      expect(req.session["start-time"]).toEqual(987654321);
    });

    it("should set the session id to locals", () => {
      sessionMiddleware()[1](req, res, next);
      expect(res.locals.sessionid).toEqual("abc123");
    });
  });
});
