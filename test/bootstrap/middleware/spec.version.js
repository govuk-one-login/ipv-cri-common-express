import { describe, vi, expect, beforeEach, it } from "vitest";

const version = require(APP_ROOT + "/src/bootstrap/middleware/version");

describe("Version", () => {
  it("exports a middleware function", () => {
    expect(typeof version.middleware()).toBe("function");
    expect(version.middleware()).toHaveLength(3);
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

    it("call res.send with the contents of version file and app name", () => {
      version.middleware()(req, res, next);

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

    it("should ignore version file if not found", () => {
      version.middleware({ versionFile: "notfound.json" })(req, res, next);

      expect(res.send).toHaveBeenCalledWith({
        appName: "test",
        appVersion: "1.0.1",
        nodeVersion: String(process.versions.node),
        featureFlags: { testFeature: true },
      });
    });
  });
});
