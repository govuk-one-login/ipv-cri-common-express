import { describe, it, expect, vi } from "vitest";

const compatibility = require(
  APP_ROOT + "/src/bootstrap/middleware/compatibility",
);

describe("Compatibility", () => {
  it("exports a middleware function", () => {
    const fn = compatibility.middleware();
    expect(typeof fn).toBe("function");
    expect(fn).toHaveLength(3);
  });

  describe("middleware", () => {
    it("should set compatibility header", () => {
      const fn = compatibility.middleware();
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
