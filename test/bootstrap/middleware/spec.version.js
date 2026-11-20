import { describe, vi, expect, beforeEach, it } from "vitest";
import { versionMiddleware } from "../../../src/bootstrap/middleware/version.js";

describe("Version", () => {
  it("returns a middleware function", async () => {
    expect(typeof (await versionMiddleware())).toBe("function");
    expect(await versionMiddleware()).toHaveLength(3);
  });

  describe("middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        send: vi.fn(),
      };
      next = vi.fn();
    });

    it("call res.send with the contents of version file and app name", async () => {
      (await versionMiddleware())(req, res, next);

      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith({
        version: "1.2.3",
        foo: "bar",
        appName: "test",
        appVersion: "1.0.1",
        nodeVersion: String(process.versions.node),
        featureFlags: { testFeature: true },
      });
    });

    it("should ignore version file if not found", async () => {
      (await versionMiddleware({ versionFile: "notfound.json" }))(
        req,
        res,
        next,
      );

      expect(res.send).toHaveBeenCalledWith({
        appName: "test",
        appVersion: "1.0.1",
        nodeVersion: String(process.versions.node),
        featureFlags: { testFeature: true },
      });
    });
  });
});
