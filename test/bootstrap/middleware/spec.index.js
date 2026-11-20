import { describe, it, vi, beforeEach, expect } from "vitest";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("express", () => ({
  default: vi.fn(),
}));
import express from "express";
vi.mock("hmpo-components", () => ({ default: { setup: vi.fn() } }));
import hmpoComponents from "hmpo-components";
vi.mock("hmpo-logger", () => ({
  default: { middleware: vi.fn().mockReturnValue("hmpoLogger middleware") },
}));
import hmpoLogger from "hmpo-logger";
vi.mock("body-parser", () => ({
  default: {
    urlencoded: vi.fn().mockReturnValue("bodyParser middleware"),
  },
}));
import bodyParser from "body-parser";
vi.mock("../../../src/bootstrap/middleware/cookies.js", () => ({
  cookieMiddleware: vi.fn().mockReturnValue("cookies middleware"),
}));
import { cookieMiddleware } from "../../../src/bootstrap/middleware/cookies.js";
vi.mock("../../../src/bootstrap/middleware/headers.js", () => ({
  setupHeaders: vi.fn(),
}));
import { setupHeaders } from "../../../src/bootstrap/middleware/headers.js";
vi.mock("../../../src/bootstrap/middleware/healthcheck.js", () => ({
  healthcheckMiddleware: vi.fn().mockReturnValue("healthcheck middleware"),
}));
import { healthcheckMiddleware } from "../../../src/bootstrap/middleware/healthcheck.js";
vi.mock("../../../src/bootstrap/middleware/version.js", () => ({
  versionMiddleware: vi.fn().mockReturnValue("version middleware"),
}));
import { versionMiddleware } from "../../../src/bootstrap/middleware/version.js";
vi.mock("../../../src/bootstrap/middleware/feature-flag.js", () => ({
  featureFlagMiddleware: vi.fn().mockReturnValue("featureFlag middleware"),
}));
import { featureFlagMiddleware } from "../../../src/bootstrap/middleware/feature-flag.js";
vi.mock("../../../src/bootstrap/middleware/model-options.js", () => ({
  modelOptionsMiddleware: vi.fn().mockReturnValue("modelOptions middleware"),
}));
import { modelOptionsMiddleware } from "../../../src/bootstrap/middleware/model-options.js";
vi.mock("../../../src/bootstrap/middleware/public.js", () => ({
  publicAssetsMiddleware: vi.fn().mockReturnValue("public middleware"),
}));
import { publicAssetsMiddleware } from "../../../src/bootstrap/middleware/public.js";
vi.mock("../../../src/bootstrap/middleware/nunjucks.js", () => ({
  setupNunjucks: vi.fn().mockReturnValue({ nunjucksEnv: "yes" }),
}));
import { setupNunjucks } from "../../../src/bootstrap/middleware/nunjucks.js";
vi.mock("../../../src/bootstrap/middleware/translation.js", () => ({
  setupTranslation: vi.fn(),
}));
import { setupTranslation } from "../../../src/bootstrap/middleware/translation.js";
vi.mock("../../../src/bootstrap/middleware/session.js", () => ({
  sessionMiddleware: vi.fn().mockReturnValue("session middleware"),
}));
import { sessionMiddleware } from "../../../src/bootstrap/middleware/session.js";
vi.mock("../../../src/bootstrap/middleware/linked-files.js", () => ({
  linkedFilesMiddleware: vi.fn().mockReturnValue("linkedFiles middleware"),
}));
import { linkedFilesMiddleware } from "../../../src/bootstrap/middleware/linked-files.js";
vi.mock("../../../src/bootstrap/middleware/page-not-found.js", () => ({
  pageNotFoundMiddleware: vi.fn().mockReturnValue("pageNotFound middleware"),
}));
import { pageNotFoundMiddleware } from "../../../src/bootstrap/middleware/page-not-found.js";
vi.mock("../../../src/bootstrap/middleware/error-handler.js", () => ({
  errorHandlerMiddleware: vi.fn().mockReturnValue("errorHandler middleware"),
}));
import { errorHandlerMiddleware } from "../../../src/bootstrap/middleware/error-handler.js";

import {
  listen,
  setupErrorHandlerMiddlewares,
  setupMiddlewares,
  setupSessionMiddlewares,
} from "../../../src/bootstrap/middleware/index.js";

const hmpoComponentsDir = dirname(
  fileURLToPath(import.meta.resolve("hmpo-components")),
);

describe("middleware functions", () => {
  let app;

  beforeEach(() => {
    app = {
      locals: { existing: "local" },
      set: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      engine: vi.fn(),
      use: vi.fn(),
      get: vi.fn(),
      listen: vi.fn(),
    };
    vi.clearAllMocks();
    vi.mocked(express).mockReturnValue(app);
  });

  it("exports middleware functions", () => {
    expect(typeof setupMiddlewares).toBe("function");
    expect(typeof setupSessionMiddlewares).toBe("function");
    expect(typeof setupErrorHandlerMiddlewares).toBe("function");
    expect(typeof listen).toBe("function");
  });

  describe("requiredArgument", () => {
    it("should throw an error when the required argument is not provided in session", () => {
      expect(() => setupSessionMiddlewares()).toThrow(Error);
      expect(() => setupSessionMiddlewares()).toThrow(
        "Argument 'app' must be specified",
      );
    });

    it("should throw an error when the required argument is not provided in errorHandler", () => {
      expect(() => setupErrorHandlerMiddlewares()).toThrow(Error);
      expect(() => setupErrorHandlerMiddlewares()).toThrow(
        "Argument 'app' must be specified",
      );
    });

    it("should throw an error when the required argument is not provided in listen", () => {
      expect(() => listen()).toThrow(Error);
      expect(() => listen()).toThrow("Argument 'app' must be specified");
    });
  });

  describe("setup", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("should not register hmpoLogger middleware if requestLogging is false", async () => {
      await setupMiddlewares({
        app,
        urls: {},
        publicOptions: {},
        cookieOptions: {},
        modelOptionsConfig: {},
        featureFlags: {},
        requestLogging: false,
      });
      expect(hmpoLogger.middleware).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("hmpoLogger middleware");
    });

    it("should use the public middleware when publicOptions is true or not set", async () => {
      await setupMiddlewares({
        urls: {
          public: "/public-url",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 }, // publicOptions is set
      });

      expect(publicAssetsMiddleware).toHaveBeenCalledWith({
        urls: {
          public: "/public-url",
          publicImages: "/public-url/images",
          version: "/version",
          healthcheck: "/healthcheck",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 },
        hmpoComponentsDir,
      });
      expect(app.use).toHaveBeenCalledWith("public middleware");
    });

    it("should not use public middleware when publicOptions is false", async () => {
      const publicOptions = false;
      const urls = {};
      const publicDirs = [];
      const publicImagesDirs = [];

      await setupMiddlewares({
        urls,
        publicDirs,
        publicImagesDirs,
        public: publicOptions,
      });

      expect(publicAssetsMiddleware).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("public middleware");
    });

    it("should set default version and healthcheck URLs if not provided", async () => {
      const urls = {};

      await setupMiddlewares({ urls });

      expect(app.locals.urls.version).toEqual("/version");
      expect(app.locals.urls.healthcheck).toEqual("/healthcheck");
    });

    it("should retain provided version and healthcheck URLs", async () => {
      const urls = {
        version: "/custom-version",
        healthcheck: "/custom-healthcheck",
      };

      await setupMiddlewares({ urls });

      expect(urls.version).toEqual("/custom-version");
      expect(urls.healthcheck).toEqual("/custom-healthcheck");
    });

    it("should create a new express app", async () => {
      const returnedApp = await setupMiddlewares();
      expect(express).toHaveBeenCalledWith();
      expect(returnedApp).toEqual(app);
    });

    it("should set the express env value", async () => {
      await setupMiddlewares();
      expect(app.set).toHaveBeenCalledWith("env", "development");
    });

    it("should use the env value specified in options", async () => {
      await setupMiddlewares({ env: "production" });
      expect(app.set).toHaveBeenCalledWith("env", "production");
    });

    it("should use the /version middleware", async () => {
      await setupMiddlewares();
      expect(versionMiddleware).toHaveBeenCalledWith();
      expect(app.get).toHaveBeenCalledWith("/version", "version middleware");
    });

    it("should not use the /version middleware", async () => {
      await setupMiddlewares({ urls: { version: false } });
      expect(versionMiddleware).not.toHaveBeenCalled();
      expect(app.get).not.toHaveBeenCalledWith(
        "/version",
        "version middleware",
      );
    });

    it("should use the /healthcheck middleware", async () => {
      await setupMiddlewares();
      expect(healthcheckMiddleware).toHaveBeenCalledWith();
      expect(app.get).toHaveBeenCalledWith(
        "/healthcheck",
        "healthcheck middleware",
      );
    });

    it("should not use the /healthcheck middleware", async () => {
      await setupMiddlewares({ urls: { healthcheck: false } });
      expect(healthcheckMiddleware).not.toHaveBeenCalled();
      expect(app.get).not.toHaveBeenCalledWith(
        "/healthcheck",
        "healthcheck middleware",
      );
    });

    it("should use the /public middleware", async () => {
      await setupMiddlewares({
        urls: {
          public: "/public-url",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 },
      });
      expect(publicAssetsMiddleware).toHaveBeenCalledWith({
        urls: {
          public: "/public-url",
          publicImages: "/public-url/images",
          version: "/version",
          healthcheck: "/healthcheck",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 },
        hmpoComponentsDir,
      });
      expect(app.use).toHaveBeenCalledWith("public middleware");
    });

    it("should use the hmpoLogger middleware", async () => {
      await setupMiddlewares();
      expect(hmpoLogger.middleware).toHaveBeenCalledWith(":request");
      expect(app.use).toHaveBeenCalledWith("hmpoLogger middleware");
    });

    it("should use the modelOptions middleware", async () => {
      await setupMiddlewares({ modelOptions: { sessionIDHeader: "ID" } });
      expect(modelOptionsMiddleware).toHaveBeenCalledWith({
        sessionIDHeader: "ID",
      });
      expect(app.use).toHaveBeenCalledWith("modelOptions middleware");
    });

    it("should use the feature flag setup middleware", async () => {
      await setupMiddlewares({
        featureFlags: { testFeature: true },
      });
      expect(featureFlagMiddleware).toHaveBeenCalledWith({
        featureFlags: { testFeature: true },
      });
      expect(app.use).toHaveBeenCalledWith("featureFlag middleware");
    });

    it("should use the cookies middleware", async () => {
      await setupMiddlewares({ cookies: { secret: "test" } });
      expect(cookieMiddleware).toHaveBeenCalledWith({
        secret: "test",
      });
      expect(app.use).toHaveBeenCalledWith("cookies middleware");
    });

    it("should use the body parser middleware", async () => {
      await setupMiddlewares();
      expect(bodyParser.urlencoded).toHaveBeenCalledWith({
        extended: true,
      });
      expect(app.use).toHaveBeenCalledWith("bodyParser middleware");
    });

    it("should setup nunjucks", async () => {
      await setupMiddlewares({
        views: "a/dir",
        nunjucks: { additional: "options" },
      });
      expect(setupNunjucks).toHaveBeenCalledWith(app, {
        views: "a/dir",
        hmpoComponentsDir,
        additional: "options",
      });
    });

    it("should setup translation", async () => {
      await setupMiddlewares({
        locales: "a/dir",
        translation: { additional: "options" },
      });
      expect(setupTranslation).toHaveBeenCalledWith(app, {
        locales: "a/dir",
        hmpoComponentsDir,
        additional: "options",
      });
    });

    it("should not setup translation when no locales or translation options are provided", async () => {
      await setupMiddlewares({});
      expect(setupTranslation).not.toHaveBeenCalled();
    });

    it("should not setup translation when translation is false", async () => {
      await setupMiddlewares({ locales: "a/dir", translation: false });
      expect(setupTranslation).not.toHaveBeenCalled();
    });

    it("should not setup translation when locales is false", async () => {
      await setupMiddlewares({
        locales: false,
        translation: { some: "option" },
      });
      expect(setupTranslation).not.toHaveBeenCalled();
    });

    it("should not setup translation when locales and translation are null", async () => {
      await setupMiddlewares({ locales: null, translation: null });
      expect(setupTranslation).not.toHaveBeenCalled();
    });

    it("should setup headers", async () => {
      await setupMiddlewares({
        disableCompression: true,
        trustProxy: ["loopback"],
        urls: { public: "/static" },
        helmet: { referrerPolicy: { policy: "no-referrer" } },
      });

      expect(setupHeaders).toHaveBeenCalledWith(app, {
        disableCompression: true,
        trustProxy: ["loopback"],
        publicPath: "/static",
        helmet: { referrerPolicy: { policy: "no-referrer" } },
      });
    });

    it("should setup hmpoComponents", async () => {
      await setupMiddlewares();
      expect(hmpoComponents.setup).toHaveBeenCalledWith(app, {
        nunjucksEnv: "yes",
      });
    });

    it("should set the globals", async () => {
      await setupMiddlewares({
        urls: { foo: "bar" },
      });
      expect(app.locals).toEqual({
        existing: "local",
        baseUrl: "/",
        assetPath: "/public",
        urls: {
          foo: "bar",
          healthcheck: "/healthcheck",
          public: "/public",
          publicImages: "/public/images",
          version: "/version",
        },
      });
    });
    it("should set res.locals.baseUrl to req.baseUrl during middleware setup", async () => {
      const req = { baseUrl: "/test-url" };
      const res = { locals: {} };
      const next = vi.fn();

      vi.mocked(app.use).mockImplementation((middlewareFunction) => {
        if (middlewareFunction.length === 3) {
          middlewareFunction(req, res, next);
        }
      });

      await setupMiddlewares();

      expect(res.locals.baseUrl).toEqual("/test-url");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("session", () => {
    it("should use session middleware", () => {
      setupSessionMiddlewares(app, { secret: "qwerty" });
      expect(sessionMiddleware).toHaveBeenCalledWith({
        secret: "qwerty",
      });
      expect(app.use).toHaveBeenCalledWith("session middleware");
    });

    it("should use the feature flag setup middleware", () => {
      setupSessionMiddlewares(app);
      expect(featureFlagMiddleware).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("featureFlag middleware");
    });

    it("should use the linked files middleware", () => {
      setupSessionMiddlewares(app, { ttl: 10 });
      expect(linkedFilesMiddleware).toHaveBeenCalledWith({
        ttl: 10,
      });
      expect(app.use).toHaveBeenCalledWith("linkedFiles middleware");
    });
  });

  describe("errorHandler", () => {
    it("should use the pageNotFound middleware", () => {
      setupErrorHandlerMiddlewares(app, { foo: "bar" });
      expect(pageNotFoundMiddleware).toHaveBeenCalledWith({
        foo: "bar",
      });
      expect(app.use).toHaveBeenCalledWith("pageNotFound middleware");
    });

    it("should use the errorHandler middleware", () => {
      setupErrorHandlerMiddlewares(app, { foo: "bar" });
      expect(errorHandlerMiddleware).toHaveBeenCalledWith({
        foo: "bar",
      });
      expect(app.use).toHaveBeenCalledWith("errorHandler middleware");
    });
  });

  describe("listen", () => {
    it("should listen on the default host and port", () => {
      listen(app);
      expect(app.listen).toHaveBeenCalledWith(
        3000,
        "0.0.0.0",
        expect.any(Function),
      );
    });

    it("should listen on the specified host and port", () => {
      listen(app, { host: "hostname", port: 8888 });
      expect(app.listen).toHaveBeenCalledWith(
        8888,
        "hostname",
        expect.any(Function),
      );
    });
  });
});
