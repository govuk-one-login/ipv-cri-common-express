import { describe, it, vi, expect, beforeEach } from "vitest";

const pageNotFound = require(
  APP_ROOT + "/src/bootstrap/middleware/page-not-found",
).middleware;

describe("Page Not Found", () => {
  let req, res, cb;

  beforeEach(() => {
    req = {};
    res = {};
    cb = vi.fn();
  });

  describe("middleware", () => {
    it("exports a function with length 3", () => {
      expect(typeof pageNotFound()).toBe("function");
      expect(pageNotFound()).toHaveLength(3);
    });

    it("called callback with an error", () => {
      pageNotFound()(req, res, cb);
      expect(cb).toHaveBeenCalledTimes(1);
      const err = cb.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual("Page not found");
      expect(err.code).toEqual("PAGE_NOT_FOUND");
      expect(err.template).toEqual("errors/page-not-found");
      expect(err.status).toEqual(404);
    });

    it("use custom error template view", () => {
      pageNotFound({ pageNotFoundView: "test" })(req, res, cb);
      const err = cb.mock.calls[0][0];
      expect(err.template).toEqual("test");
    });
  });
});
