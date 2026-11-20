import { describe, vi, it, expect } from "vitest";
import { noCacheMiddleware } from "../../../src/bootstrap/middleware/nocache.js";

describe("No Cache", () => {
  it("exports a middleware function", () => {
    expect(typeof noCacheMiddleware()).toBe("function");
    expect(noCacheMiddleware()).toHaveLength(3);
  });

  describe("middleware", () => {
    it("should set no cache headers", () => {
      let req = {
        path: "/a/path",
      };
      let res = {
        setHeader: vi.fn(),
      };
      let next = vi.fn();

      noCacheMiddleware()(req, res, next);

      expect(res.setHeader).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenNthCalledWith(
        1,
        "Surrogate-Control",
        "no-store",
      );

      expect(res.setHeader).toHaveBeenNthCalledWith(
        2,
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      expect(res.setHeader).toHaveBeenNthCalledWith(3, "Pragma", "no-cache");
      expect(res.setHeader).toHaveBeenNthCalledWith(4, "Expires", "0");

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it("should not set no cache headers for a public URL", () => {
      let req = {
        path: "/a/path/public/foo/bar",
      };
      let res = {
        setHeader: vi.fn(),
      };
      let next = vi.fn();

      noCacheMiddleware({ publicPath: "/public" })(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
