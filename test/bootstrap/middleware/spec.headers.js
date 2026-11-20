import { describe, vi, it, expect, beforeEach } from "vitest";
vi.mock("../../../src/bootstrap/middleware/nocache.js", () => ({
  noCacheMiddleware: vi.fn().mockReturnValue("nocache middleware"),
}));
import { noCacheMiddleware } from "../../../src/bootstrap/middleware/nocache.js";
vi.mock("../../../src/bootstrap/middleware/compatibility.js", () => ({
  browserCompatibilityMiddleware: vi
    .fn()
    .mockReturnValue("compatibility middleware"),
}));
import { browserCompatibilityMiddleware } from "../../../src/bootstrap/middleware/compatibility.js";
vi.mock("compression", () => ({
  default: vi.fn().mockReturnValue("compression middleware"),
}));
vi.mock("helmet", () => ({
  default: vi.fn(),
  frameguard: vi.fn().mockReturnValue("frameguard middleware"),
}));
import helmet, { frameguard } from "helmet";
import { setupHeaders } from "../../../src/bootstrap/middleware/headers.js";
import compression from "compression";

describe("headers middleware", () => {
  let app;

  beforeEach(() => {
    app = {
      disable: vi.fn(),
      set: vi.fn(),
      use: vi.fn(),
    };
  });

  describe("headers", () => {
    it("should enable trust proxy by default", () => {
      setupHeaders(app);
      expect(app.set).toHaveBeenCalledWith("trust proxy", true);
    });

    it("should set trust proxy to config setting", () => {
      setupHeaders(app, { trustProxy: ["loopback", "localunique"] });
      expect(app.set).toHaveBeenCalledWith("trust proxy", [
        "loopback",
        "localunique",
      ]);
    });

    it("should use the nocache middleware", () => {
      setupHeaders(app);
      expect(noCacheMiddleware).toHaveBeenCalledWith({
        publicPath: "/public",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the nocache middleware with options", () => {
      setupHeaders(app, { publicPath: "/static" });
      expect(noCacheMiddleware).toHaveBeenCalledWith({
        publicPath: "/static",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the returned compression middleware", () => {
      setupHeaders(app);
      expect(compression).toHaveBeenCalledTimes(1);
      expect(compression).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compression middleware");
    });

    it("should not use the returned compression middleware if compression is disabled", () => {
      setupHeaders(app, { disableCompression: true });
      expect(compression).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("compression middleware");
    });

    it("should use the compatibility middleware", () => {
      setupHeaders(app);
      expect(browserCompatibilityMiddleware).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compatibility middleware");
    });
  });

  describe("security", () => {
    describe("by default without helmet config", () => {
      it("should disable the x-powered-by header", () => {
        setupHeaders(app);
        expect(app.disable).toHaveBeenCalledWith("x-powered-by");
      });

      it("should use the returned frameguard middleware", () => {
        setupHeaders(app);

        expect(frameguard).toHaveBeenCalledTimes(1);
        expect(frameguard).toHaveBeenCalledWith("sameorigin");
        expect(app.use).toHaveBeenCalledWith("frameguard middleware");
      });
    });

    describe("with helmet config", () => {
      let helmetConfig;

      beforeEach(() => {
        helmetConfig = {
          contentSecurityPolicy: false,
        };
      });

      it("should call helmet with config", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(helmet).toHaveBeenCalledWith(helmetConfig);
      });

      it("should not directly disable the x-powered-by header", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(app.disable).not.toHaveBeenCalledWith("x-powered-by");
      });

      it("should not directly use the returned frameguard middleware", () => {
        setupHeaders(app, { helmet: helmetConfig });

        expect(frameguard).not.toHaveBeenCalled();
        expect(app.use).not.toHaveBeenCalledWith("frameguard middleware");
      });
    });
  });
});
