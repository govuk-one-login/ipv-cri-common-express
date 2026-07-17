import { describe, it, expect, vi, beforeEach } from "vitest";

const cookies = require(APP_ROOT + "/src/bootstrap/middleware/cookies");

describe("Cookies", () => {
  describe("middleware", () => {
    let parser, fn, req, res, next, cookieStub;

    beforeEach(() => {
      [parser, fn] = cookies.middleware({ secret: "abc123" });
      cookieStub = vi.fn();
      req = {
        protocol: "http",
      };
      res = {
        cookie: cookieStub,
      };
      next = vi.fn();
    });

    it("should create a cookie middleware", () => {
      expect(typeof parser).toBe("function");
      expect(parser).toHaveLength(3);
      expect(typeof fn).toBe("function");
      expect(fn).toHaveLength(3);
    });

    it("should default options to an empty object", () => {
      [parser, fn] = cookies.middleware();
      expect(typeof parser).toBe("function");
      expect(parser).toHaveLength(3);
      expect(typeof fn).toBe("function");
      expect(fn).toHaveLength(3);
    });

    it("should replace res.cookie with a function", () => {
      fn(req, res, next);
      expect(res.cookie).not.toEqual(cookieStub);
    });

    it("should call the original res.cookie with secure values", () => {
      fn(req, res, next);
      res.cookie("name", "value");
      expect(cookieStub).toHaveBeenCalledTimes(1);
      expect(cookieStub).toHaveBeenCalledWith("name", "value", {
        secure: false,
        httpOnly: true,
        path: "/",
      });
    });

    it("should set secure if the request was over https", () => {
      fn(req, res, next);
      req.protocol = "https";
      res.cookie("name", "value");
      expect(cookieStub).toHaveBeenCalledTimes(1);
      expect(cookieStub).toHaveBeenCalledWith("name", "value", {
        secure: true,
        httpOnly: true,
        path: "/",
      });
    });

    it("should extend and override supplied options", () => {
      fn(req, res, next);
      res.cookie("name", "value", { expires: "now", httpOnly: false });
      expect(cookieStub).toHaveBeenCalledTimes(1);
      expect(cookieStub).toHaveBeenCalledWith("name", "value", {
        expires: "now",
        secure: false,
        httpOnly: true,
        path: "/",
      });
    });
  });
});
