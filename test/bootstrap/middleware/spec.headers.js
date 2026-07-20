import { describe, vi, it, expect, beforeEach } from "vitest";

const proxyquire = require("proxyquire").noPreserveCache();

describe("headers middleware", () => {
  let app, middleware, stubs;

  beforeEach(() => {
    app = {
      disable: vi.fn(),
      set: vi.fn(),
      use: vi.fn(),
    };

    stubs = {
      compression: vi.fn().mockReturnValue("compression middleware"),
      nocache: {
        middleware: vi.fn().mockReturnValue("nocache middleware"),
      },
      compatibility: {
        middleware: vi.fn().mockReturnValue("compatibility middleware"),
      },
      helmet: vi.fn(),
    };

    stubs.helmet.frameguard = vi.fn().mockReturnValue("frameguard middleware");

    middleware = proxyquire(APP_ROOT + "/src/bootstrap/middleware/headers", {
      compression: stubs.compression,
      "./nocache": stubs.nocache,
      "./compatibility": stubs.compatibility,
      helmet: stubs.helmet,
    });
  });

  describe("headers", () => {
    it("should enable trust proxy by default", () => {
      middleware.setup(app);
      expect(app.set).toHaveBeenCalledWith("trust proxy", true);
    });

    it("should set trust proxy to config setting", () => {
      middleware.setup(app, { trustProxy: ["loopback", "localunique"] });
      expect(app.set).toHaveBeenCalledWith("trust proxy", [
        "loopback",
        "localunique",
      ]);
    });

    it("should use the nocache middleware", () => {
      middleware.setup(app);
      expect(stubs.nocache.middleware).toHaveBeenCalledWith({
        publicPath: "/public",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the nocache middleware with options", () => {
      middleware.setup(app, { publicPath: "/static" });
      expect(stubs.nocache.middleware).toHaveBeenCalledWith({
        publicPath: "/static",
      });
      expect(app.use).toHaveBeenCalledWith("nocache middleware");
    });

    it("should use the returned compression middleware", () => {
      middleware.setup(app);
      expect(stubs.compression).toHaveBeenCalledTimes(1);
      expect(stubs.compression).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compression middleware");
    });

    it("should not use the returned compression middleware if compression is disabled", () => {
      middleware.setup(app, { disableCompression: true });
      expect(stubs.compression).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("compression middleware");
    });

    it("should use the compatibility middleware", () => {
      middleware.setup(app);
      expect(stubs.compatibility.middleware).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("compatibility middleware");
    });
  });

  describe("security", () => {
    describe("by default without helmet config", () => {
      it("should disable the x-powered-by header", () => {
        middleware.setup(app);
        expect(app.disable).toHaveBeenCalledWith("x-powered-by");
      });

      it("should use the returned frameguard middleware", () => {
        middleware.setup(app);

        expect(stubs.helmet.frameguard).toHaveBeenCalledTimes(1);
        expect(stubs.helmet.frameguard).toHaveBeenCalledWith("sameorigin");
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
        middleware.setup(app, { helmet: helmetConfig });

        expect(stubs.helmet).toHaveBeenCalledWith(helmetConfig);
      });

      it("should not directly disable the x-powered-by header", () => {
        middleware.setup(app, { helmet: helmetConfig });

        expect(app.disable).not.toHaveBeenCalledWith("x-powered-by");
      });

      it("should not directly use the returned frameguard middleware", () => {
        middleware.setup(app, { helmet: helmetConfig });

        expect(stubs.helmet.frameguard).not.toHaveBeenCalled();
        expect(app.use).not.toHaveBeenCalledWith("frameguard middleware");
      });
    });
  });
});
