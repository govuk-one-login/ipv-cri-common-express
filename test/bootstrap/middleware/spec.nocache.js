import { describe, vi, it, expect } from "vitest";

const nocache = require(APP_ROOT + "/src/bootstrap/middleware/nocache");

describe("No Cache", () => {
  it("exports a middleware function", () => {
    expect(typeof nocache.middleware()).toBe("function");
    expect(nocache.middleware()).toHaveLength(3);
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

      nocache.middleware()(req, res, next);

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

      nocache.middleware({ publicPath: "/public" })(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
