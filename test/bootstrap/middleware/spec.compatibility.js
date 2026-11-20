import { describe, it, expect, vi } from "vitest";
import { browserCompatibilityMiddleware } from "../../../src/bootstrap/middleware/compatibility.js";

describe("Compatibility", () => {
  it("exports a middleware function", () => {
    const fn = browserCompatibilityMiddleware();
    expect(typeof fn).toBe("function");
    expect(fn).toHaveLength(3);
  });

  describe("middleware", () => {
    it("should set compatibility header", () => {
      const fn = browserCompatibilityMiddleware();
      const req = {};
      const res = {
        setHeader: vi.fn(),
      };
      const next = vi.fn();

      fn(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "X-UA-Compatible",
        "IE=edge,chrome=1",
      );

      expect(next).toHaveBeenCalled();
    });
  });
});
