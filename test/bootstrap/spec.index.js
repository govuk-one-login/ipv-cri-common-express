import { expect, describe, it, vi, beforeEach } from "vitest";
import express from "express";
import { randomUUID } from "node:crypto";

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

vi.mock("../../src/bootstrap/middleware/index.js");
import {
  setupSessionMiddlewares,
  setupErrorHandlerMiddlewares,
} from "../../src/bootstrap/middleware/index.js";

import { appSetup } from "../../src/bootstrap/index.js";

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

    it("calls config.setup", async () => {
      await appSetup();
      expect(setupConfig).toHaveBeenCalledWith(undefined);
    });

    it("calls config.setup with options", async () => {
      await appSetup({ config: { option: true } });
      expect(setupConfig).toHaveBeenCalledWith({
        option: true,
      });
    });

    it("should not call config.setup if option is false", async () => {
      await appSetup({ config: false });
      expect(setupConfig).not.toHaveBeenCalled();
    });

    it("calls logger.setup with options", async () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "logs") return { config: true };
      });
      await appSetup({ logs: { option: true } });
      expect(setupLogger).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call logger.setup if option is false", async () => {
      await appSetup({ logs: false });
      expect(setupLogger).not.toHaveBeenCalled();
    });

    it("calls redisClient.setup with options", async () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "redis") return { config: true };
      });
      await appSetup({ redis: { option: true } });
      expect(setupRedisClient).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("should not call redisClient.setup if option is false", async () => {
      await appSetup({ redis: false });
      expect(setupRedisClient).not.toHaveBeenCalled();
    });

    it("calls middleware.setup with options", async () => {
      getConfig.mockReturnValue({ config: true });
      await appSetup({ option: true });
      expect(setupMiddlewares).toHaveBeenCalledWith({
        option: true,
        config: true,
      });
    });

    it("calls middleware.session with options", async () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "session") return { config: true };
      });
      await appSetup({ session: { option: true } });
      expect(setupSessionMiddlewares).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.session if option is false", async () => {
      await appSetup({ session: false });
      expect(setupSessionMiddlewares).not.toHaveBeenCalled();
    });

    it("calls middleware.errorHandler with options", async () => {
      getConfigMock.mockImplementation((arg) => {
        if (arg === "errors") return { config: true };
      });
      await appSetup({ errors: { option: true } });
      expect(setupErrorHandlerMiddlewares).toHaveBeenCalledWith(app, {
        option: true,
        config: true,
      });
    });

    it("should not call middleware.errorHandler if option is false", async () => {
      await appSetup({ errors: false });
      expect(setupErrorHandlerMiddlewares).not.toHaveBeenCalled();
    });

    it("should call middlewareSetupFn if option is defined", async () => {
      const callbackStub = vi.fn();
      await appSetup({ middlewareSetupFn: callbackStub });
      expect(callbackStub).toHaveBeenCalled();
    });

    it("does not mount the public 404 fallback if public option is false", async () => {
      await appSetup({ public: false });
      expect(express.Router).toHaveBeenCalledTimes(3);
    });

    it("calls middleware.listen with options", async () => {
      getConfig.mockImplementation((arg) => {
        if (arg === "host") return "hostname";
        if (arg === "port") return 1234;
      });

      await appSetup({ port: 5678 });
      expect(listen).toHaveBeenCalledWith(app, {
        port: 5678,
        host: "hostname",
      });
    });

    it("should not call middleware.listen if port is false", async () => {
      await appSetup({ port: false });
      expect(listen).not.toHaveBeenCalled();
    });

    it("returns apps and routers", async () => {
      const routers = await appSetup({ public: false });

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
