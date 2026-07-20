import { expect, describe, it, vi, beforeEach, afterEach } from "vitest";

const index = require(APP_ROOT + "/src/bootstrap");
const express = require("express");

describe("hmpo-app", () => {
  it("should export setup functions and libs", () => {
    expect(Object.keys(index)).toEqual(
      expect.arrayContaining([
        "setup",
        "middleware",
        "config",
        "logger",
        "redisClient",
        "translation",
        "nunjucks",
        "linkedFiles",
        "featureFlag",
      ]),
    );
  });

  describe("setup", () => {
    let app;
    let staticRouter;
    let router;
    let errorRouter;
    let publicFallbackRouter;
    let routerSpy;

    beforeEach(() => {
      const redisStub = {
        del: vi.fn(),
        expire: vi.fn(),
        get: vi.fn(),
        setex: vi.fn(),
      };

      app = {
        use: vi.fn(),
        get: vi.fn(),
        locals: { urls: { public: "/public", publicImages: "/public/images" } },
      };
      publicFallbackRouter = {
        use: vi.fn(),
      };
      staticRouter = {
        use: vi.fn(),
      };
      router = {
        use: vi.fn(),
      };
      errorRouter = {
        use: vi.fn(),
      };
      routerSpy = vi.spyOn(express, "Router");
      routerSpy
        .mockReturnValueOnce(staticRouter)
        .mockReturnValueOnce(publicFallbackRouter)
        .mockReturnValueOnce(router)
        .mockReturnValueOnce(errorRouter);
      vi.spyOn(index.config, "get");
      vi.spyOn(index.config, "setup");
      vi.spyOn(index.logger, "setup");
      vi.spyOn(index.redisClient, "setup").mockImplementation(() => {});
      vi.spyOn(index.redisClient, "getClient").mockReturnValue(redisStub);
      vi.spyOn(index.middleware, "setup").mockReturnValue(app);
      vi.spyOn(index.middleware, "session");
      vi.spyOn(index.middleware, "errorHandler");
      vi.spyOn(index.middleware, "listen").mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls config.setup", () => {
      index.setup();
      expect(index.config.setup).toHaveBeenCalledWith(undefined);
    });

    it("calls config.setup with options", () => {
      index.setup({ config: { option: true } });
      expect(index.config.setup).toHaveBeenCalledWith({
        option: true,
      });
    });

    it("should not call config.setup if option is false", () => {
      index.setup({ config: false });
      expect(index.config.setup).not.toHaveBeenCalled();
    });

    it("calls logger.setup with options", () => {
      index.config.get.mockImplementation((arg) => {
        if (arg === "logs") return { config: true };
      });
      index.setup({ logs: { option: true } });
      expect(index.logger.setup).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call logger.setup if option is false", () => {
      index.setup({ logs: false });
      expect(index.logger.setup).not.toHaveBeenCalled();
    });

    it("calls redisClient.setup with options", () => {
      index.config.get.mockImplementation((arg) => {
        if (arg === "redis") return { config: true };
      });
      index.setup({ redis: { option: true } });
      expect(index.redisClient.setup).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call redisClient.setup if option is false", () => {
      index.setup({ redis: false });
      expect(index.redisClient.setup).not.toHaveBeenCalled();
    });

    it("calls middleware.setup with options", () => {
      index.config.get.mockReturnValue({ config: true });
      index.setup({ option: true });
      expect(index.middleware.setup).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("calls middleware.session with options", () => {
      index.config.get.mockImplementation((arg) => {
        if (arg === "session") return { config: true };
      });
      index.setup({ session: { option: true } });
      expect(index.middleware.session).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.session if option is false", () => {
      index.setup({ session: false });
      expect(index.middleware.session).not.toHaveBeenCalled();
    });

    it("calls middleware.errorHandler with options", () => {
      index.config.get.mockImplementation((arg) => {
        if (arg === "errors") return { config: true };
      });
      index.setup({ errors: { option: true } });
      expect(index.middleware.errorHandler).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.errorHandler if option is false", () => {
      index.setup({ errors: false });
      expect(index.middleware.errorHandler).not.toHaveBeenCalled();
    });

    it("should call middlewareSetupFn if option is defined", () => {
      const callbackStub = vi.fn();
      index.setup({ middlewareSetupFn: callbackStub });
      expect(callbackStub).toHaveBeenCalled();
    });

    it("mounts the public 404 fallback after staticRouter", () => {
      index.setup();
      expect(app.use).toHaveBeenNthCalledWith(1, staticRouter);
      expect(app.use).toHaveBeenNthCalledWith(2, publicFallbackRouter);
    });

    it("does not mount the public 404 fallback if public option is false", () => {
      index.setup({ public: false });
      expect(express.Router).toHaveBeenCalledTimes(3);
    });

    it("calls middleware.listen with options", () => {
      index.config.get.mockImplementation((arg) => {
        if (arg === "host") return "hostname";
        if (arg === "port") return 1234;
      });

      index.setup({ port: 5678 });
      expect(index.middleware.listen).toHaveBeenCalledWith(app, {
        port: 5678,
        host: "hostname",
      });
    });

    it("should not call middleware.listen if port is false", () => {
      index.setup({ port: false });
      expect(index.middleware.listen).not.toHaveBeenCalled();
    });

    it("returns apps and routers", () => {
      const routers = index.setup();
      expect(routers).toEqual({
        app,
        staticRouter: staticRouter,
        router: router,
        errorRouter: errorRouter,
      });
    });
  });
});
