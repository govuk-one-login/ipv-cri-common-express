import { expect, describe, it, vi, beforeEach } from "vitest";
import express from "express";
import { appSetup } from "../../src/bootstrap/index.js";

vi.mock("../../src/bootstrap/lib/config.js");
import { getConfig, setupConfig } from "../../src/bootstrap/lib/config.js";

vi.mock("../../src/bootstrap/lib/logger.js");
import { setupLogger } from "../../src/bootstrap/lib/logger.js";

const redisClientGetterMock = vi.hoisted(() => vi.fn());
const setupRedisClientMock = vi.hoisted(() => vi.fn());
vi.mock("../../src/bootstrap/lib/redis-client.js", () => ({
  setupRedisClient: setupRedisClientMock,
  redisClientStore: { client: { get: redisClientGetterMock } },
}));
import { setupRedisClient } from "../../src/bootstrap/lib/redis-client.js";

vi.mock("../../src/bootstrap/middleware/index.js");
import {
  setupMiddlewares,
  listen,
} from "../../src/bootstrap/middleware/index.js";

vi.mock("../../src/bootstrap/middleware/session.js");
import { sessionMiddleware } from "../../src/bootstrap/middleware/session.js";

vi.mock("../../src/bootstrap/middleware/error-handler.js");
import { errorHandlerMiddleware } from "../../src/bootstrap/middleware/error-handler.js";
import { randomUUID } from "node:crypto";

const setupMiddlewaresMock = vi.mocked(setupMiddlewares);
const listenMock = vi.mocked(listen);
const getConfigMock = vi.mocked(getConfig);

describe("hmpo-app", () => {
  describe("setup", () => {
    let app;
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
      routerSpy = vi.spyOn(express, "Router");
      routerSpy.mockImplementation(() => ({
        type: "router",
        id: randomUUID(),
        use: vi.fn(),
      }));
      setupRedisClientMock.mockImplementation(() => {});
      redisClientGetterMock.mockReturnValue(() => redisStub);
      setupMiddlewaresMock.mockReturnValue(app);
      listenMock.mockImplementation(() => {});
    });

    it("calls config.setup", () => {
      appSetup();
      expect(setupConfig).toHaveBeenCalledWith(undefined);
    });

    it("calls config.setup with options", () => {
      appSetup({ config: { option: true } });
      expect(setupConfig).toHaveBeenCalledWith({
        option: true,
      });
    });

    it("should not call config.setup if option is false", () => {
      appSetup({ config: false });
      expect(setupConfig).not.toHaveBeenCalled();
    });

    it("calls logger.setup with options", () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "logs") return { config: true };
      });
      appSetup({ logs: { option: true } });
      expect(setupLogger).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call logger.setup if option is false", () => {
      appSetup({ logs: false });
      expect(setupLogger).not.toHaveBeenCalled();
    });

    it("calls redisClient.setup with options", () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "redis") return { config: true };
      });
      appSetup({ redis: { option: true } });
      expect(setupRedisClient).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call redisClient.setup if option is false", () => {
      appSetup({ redis: false });
      expect(setupRedisClient).not.toHaveBeenCalled();
    });

    it("calls middleware.setup with options", () => {
      getConfig.mockReturnValue({ config: true });
      appSetup({ option: true });
      expect(setupMiddlewares).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("calls middleware.session with options", () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "session") return { config: true };
      });
      appSetup({ session: { option: true } });
      expect(sessionMiddleware).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.session if option is false", () => {
      appSetup({ session: false });
      expect(sessionMiddleware).not.toHaveBeenCalled();
    });

    it("calls middleware.errorHandler with options", () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "errors") return { config: true };
      });
      appSetup({ errors: { option: true } });
      expect(errorHandlerMiddleware).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.errorHandler if option is false", () => {
      appSetup({ errors: false });
      expect(errorHandlerMiddleware).not.toHaveBeenCalled();
    });

    it("should call middlewareSetupFn if option is defined", () => {
      const callbackStub = vi.fn();
      appSetup({ middlewareSetupFn: callbackStub });
      expect(callbackStub).toHaveBeenCalled();
    });

    it("does not mount the public 404 fallback if public option is false", () => {
      appSetup({ public: false });
      expect(express.Router).toHaveBeenCalledTimes(3);
    });

    it("calls middleware.listen with options", () => {
      getConfig.mockImplementation((arg) => {
        if (arg === "host") return "hostname";
        if (arg === "port") return 1234;
      });

      appSetup({ port: 5678 });
      expect(listen).toHaveBeenCalledWith(app, {
        port: 5678,
        host: "hostname",
      });
    });

    it("should not call middleware.listen if port is false", () => {
      appSetup({ port: false });
      expect(listen).not.toHaveBeenCalled();
    });

    it("returns apps and routers", () => {
      const routers = appSetup({ public: false });

      expect(routers).toEqual({
        app,
        staticRouter: {
          type: "router",
          id: expect.any(String),
          use: expect.any(Function),
        },
        router: {
          type: "router",
          id: expect.any(String),
          use: expect.any(Function),
        },
        errorRouter: {
          type: "router",
          id: expect.any(String),
          use: expect.any(Function),
        },
      });

      // confirm that the router instances are different
      expect(
        new Set([
          routers.staticRouter.id,
          routers.router.id,
          routers.errorRouter.id,
        ]),
      ).toHaveLength(3);
    });
  });
});
