import { describe, it, vi, expect, beforeEach } from "vitest";
import { pageNotFoundMiddleware } from "../../../src/bootstrap/middleware/page-not-found.js";

describe("Page Not Found", () => {
  let req, res, cb;

  beforeEach(() => {
    req = {};
    res = {};
    cb = vi.fn();
  });

  describe("middleware", () => {
    it("exports a function with length 3", () => {
      expect(typeof pageNotFoundMiddleware()).toBe("function");
      expect(pageNotFoundMiddleware()).toHaveLength(3);
    });

    it("called callback with an error", () => {
      pageNotFoundMiddleware()(req, res, cb);
      expect(cb).toHaveBeenCalledTimes(1);
      const err = cb.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual("Page not found");
      expect(err.code).toEqual("PAGE_NOT_FOUND");
      expect(err.template).toEqual("errors/page-not-found");
      expect(err.status).toEqual(404);
    });

    it("use custom error template view", () => {
      pageNotFoundMiddleware({ pageNotFoundView: "test" })(req, res, cb);
      const err = cb.mock.calls[0][0];
      expect(err.template).toEqual("test");
    });
  });
});
