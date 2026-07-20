import { describe, it, vi, beforeEach, expect } from "vitest";

const path = require("path");
const proxyquire = require("proxyquire").noPreserveCache();
const hmpoComponentsDir = path.dirname(require.resolve("hmpo-components"));

describe("middleware functions", () => {
  let middleware, app;

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
  });

  it("exports middleware functions", () => {
    middleware = require(APP_ROOT + "/src/bootstrap/middleware");
    expect(typeof middleware.setup).toBe("function");
    expect(typeof middleware.session).toBe("function");
    expect(typeof middleware.errorHandler).toBe("function");
    expect(typeof middleware.listen).toBe("function");
  });

  describe("requiredArgument", () => {
    it("should throw an error when the required argument is not provided in session", () => {
      expect(() => middleware.session()).toThrow(Error);
      expect(() => middleware.session()).toThrow(
        "Argument 'app' must be specified",
      );
    });

    it("should throw an error when the required argument is not provided in errorHandler", () => {
      expect(() => middleware.errorHandler()).toThrow(Error);
      expect(() => middleware.errorHandler()).toThrow(
        "Argument 'app' must be specified",
      );
    });

    it("should throw an error when the required argument is not provided in listen", () => {
      expect(() => middleware.listen()).toThrow(Error);
      expect(() => middleware.listen()).toThrow(
        "Argument 'app' must be specified",
      );
    });
  });

  describe("setup", () => {
    let stubs, nunjucksEnv;

    beforeEach(() => {
      nunjucksEnv = {};
      vi.stubEnv("NODE_ENV", "development");
      stubs = {
        express: vi.fn().mockReturnValue(app),
        hmpoLogger: {
          middleware: vi.fn().mockReturnValue("hmpoLogger middleware"),
        },
        bodyParser: {
          urlencoded: vi.fn().mockReturnValue("bodyParser middleware"),
        },
        cookies: {
          middleware: vi.fn().mockReturnValue("cookies middleware"),
        },
        headers: {
          setup: vi.fn().mockReturnValue({}),
        },
        healthcheck: {
          middleware: vi.fn().mockReturnValue("healthcheck middleware"),
        },
        version: {
          middleware: vi.fn().mockReturnValue("version middleware"),
        },
        featureFlag: {
          middleware: vi.fn().mockReturnValue("featureFlag middleware"),
        },
        modelOptions: {
          middleware: vi.fn().mockReturnValue("modelOptions middleware"),
        },
        public: {
          middleware: vi.fn().mockReturnValue("public middleware"),
        },
        nunjucks: {
          setup: vi.fn().mockReturnValue(nunjucksEnv),
        },
        translation: {
          setup: vi.fn(),
        },
        hmpoComponents: {
          setup: vi.fn(),
        },
      };

      middleware = proxyquire(APP_ROOT + "/src/bootstrap/middleware", {
        express: stubs.express,
        "body-parser": stubs.bodyParser,
        "hmpo-logger": stubs.hmpoLogger,
        "hmpo-components": stubs.hmpoComponents,
        "./nunjucks": stubs.nunjucks,
        "./public": stubs.public,
        "./translation": stubs.translation,
        "./headers": stubs.headers,
        "./healthcheck": stubs.healthcheck,
        "./model-options": stubs.modelOptions,
        "./version": stubs.version,
        "./cookies": stubs.cookies,
        "./feature-flag": stubs.featureFlag,
      });
    });

    it("should not register hmpoLogger middleware if requestLogging is false", () => {
      middleware.setup({
        app,
        urls: {},
        publicOptions: {},
        cookieOptions: {},
        modelOptionsConfig: {},
        featureFlags: {},
        requestLogging: false,
        stubs,
      });
      expect(stubs.hmpoLogger.middleware).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("hmpoLogger middleware");
    });

    it("should use the public middleware when publicOptions is true or not set", () => {
      middleware.setup({
        urls: {
          public: "/public-url",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 }, // publicOptions is set
      });

      expect(stubs.public.middleware).toHaveBeenCalledWith({
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

    it("should not use public middleware when publicOptions is false", () => {
      const publicOptions = false;
      const urls = {};
      const publicDirs = [];
      const publicImagesDirs = [];

      middleware.setup({
        urls,
        publicDirs,
        publicImagesDirs,
        public: publicOptions,
      });

      expect(stubs.public.middleware).not.toHaveBeenCalled();
      expect(app.use).not.toHaveBeenCalledWith("public middleware");
    });

    it("should set default version and healthcheck URLs if not provided", () => {
      const urls = {};

      middleware.setup({ urls });

      expect(urls.version).toEqual("/version");
      expect(urls.healthcheck).toEqual("/healthcheck");
    });

    it("should retain provided version and healthcheck URLs", () => {
      const urls = {
        version: "/custom-version",
        healthcheck: "/custom-healthcheck",
      };

      middleware.setup({ urls });

      expect(urls.version).toEqual("/custom-version");
      expect(urls.healthcheck).toEqual("/custom-healthcheck");
    });

    it("should create a new express app", () => {
      const returnedApp = middleware.setup();
      expect(stubs.express).toHaveBeenCalledWith();
      expect(returnedApp).toEqual(app);
    });

    it("should set the express env value", () => {
      middleware.setup();
      expect(app.set).toHaveBeenCalledWith("env", "development");
    });

    it("should use the env value specified in options", () => {
      middleware.setup({ env: "production" });
      expect(app.set).toHaveBeenCalledWith("env", "production");
    });

    it("should use the /version middleware", () => {
      middleware.setup();
      expect(stubs.version.middleware).toHaveBeenCalledWith();
      expect(app.get).toHaveBeenCalledWith("/version", "version middleware");
    });

    it("should not use the /version middleware", () => {
      middleware.setup({ urls: { version: false } });
      expect(stubs.version.middleware).not.toHaveBeenCalled();
      expect(app.get).not.toHaveBeenCalledWith(
        "/version",
        "version middleware",
      );
    });

    it("should use the /healthcheck middleware", () => {
      middleware.setup();
      expect(stubs.healthcheck.middleware).toHaveBeenCalledWith();
      expect(app.get).toHaveBeenCalledWith(
        "/healthcheck",
        "healthcheck middleware",
      );
    });

    it("should not use the /healthcheck middleware", () => {
      middleware.setup({ urls: { healthcheck: false } });
      expect(stubs.healthcheck.middleware).not.toHaveBeenCalled();
      expect(app.get).not.toHaveBeenCalledWith(
        "/healthcheck",
        "healthcheck middleware",
      );
    });

    it("should use the /public middleware", () => {
      middleware.setup({
        urls: {
          public: "/public-url",
        },
        publicDirs: ["public"],
        publicImagesDirs: ["assets/images"],
        public: { maxAge: 3600 },
      });
      expect(stubs.public.middleware).toHaveBeenCalledWith({
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

    it("should use the hmpoLogger middleware", () => {
      middleware.setup();
      expect(stubs.hmpoLogger.middleware).toHaveBeenCalledWith(":request");
      expect(app.use).toHaveBeenCalledWith("hmpoLogger middleware");
    });

    it("should use the modelOptions middleware", () => {
      middleware.setup({ modelOptions: { sessionIDHeader: "ID" } });
      expect(stubs.modelOptions.middleware).toHaveBeenCalledWith({
        sessionIDHeader: "ID",
      });
      expect(app.use).toHaveBeenCalledWith("modelOptions middleware");
    });

    it("should use the feature flag setup middleware", () => {
      middleware.setup({
        featureFlags: { testFeature: true },
      });
      expect(stubs.featureFlag.middleware).toHaveBeenCalledWith({
        featureFlags: { testFeature: true },
      });
      expect(app.use).toHaveBeenCalledWith("featureFlag middleware");
    });

    it("should use the cookies middleware", () => {
      middleware.setup({ cookies: { secret: "test" } });
      expect(stubs.cookies.middleware).toHaveBeenCalledWith({
        secret: "test",
      });
      expect(app.use).toHaveBeenCalledWith("cookies middleware");
    });

    it("should use the body parser middleware", () => {
      middleware.setup();
      expect(stubs.bodyParser.urlencoded).toHaveBeenCalledWith({
        extended: true,
      });
      expect(app.use).toHaveBeenCalledWith("bodyParser middleware");
    });

    it("should setup nunjucks", () => {
      middleware.setup({ views: "a/dir", nunjucks: { additional: "options" } });
      expect(stubs.nunjucks.setup).toHaveBeenCalledWith(app, {
        views: "a/dir",
        hmpoComponentsDir,
        additional: "options",
      });
    });

    it("should setup translation", () => {
      middleware.setup({
        locales: "a/dir",
        translation: { additional: "options" },
      });
      expect(stubs.translation.setup).toHaveBeenCalledWith(app, {
        locales: "a/dir",
        hmpoComponentsDir,
        additional: "options",
      });
    });

    it("should not setup translation when no locales or translation options are provided", () => {
      middleware.setup({});
      expect(stubs.translation.setup).not.toHaveBeenCalled();
    });

    it("should setup headers", () => {
      middleware.setup({
        disableCompression: true,
        trustProxy: ["localhost"],
        urls: { public: "/static" },
        helmet: { referrerPolicy: { policy: "no-referrer" } },
      });

      expect(stubs.headers.setup).toHaveBeenCalledWith(app, {
        disableCompression: true,
        trustProxy: ["localhost"],
        publicPath: "/static",
        helmet: { referrerPolicy: { policy: "no-referrer" } },
      });
    });

    it("should setup hmpoComponents", () => {
      middleware.setup();
      expect(stubs.hmpoComponents.setup).toHaveBeenCalledWith(app, nunjucksEnv);
    });

    it("should set the globals", () => {
      middleware.setup({
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
    it("should set res.locals.baseUrl to req.baseUrl during middleware setup", () => {
      const req = { baseUrl: "/test-url" };
      const res = { locals: {} };
      const next = vi.fn();

      app.use.mockImplementation((middlewareFunction) => {
        if (middlewareFunction.length === 3) {
          middlewareFunction(req, res, next);
        }
      });

      middleware.setup();

      expect(res.locals.baseUrl).toEqual("/test-url");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("session", () => {
    let stubs;

    beforeEach(() => {
      stubs = {
        session: {
          middleware: vi.fn().mockReturnValue("session middleware"),
        },
        featureFlag: {
          middleware: vi.fn().mockReturnValue("featureFlag middleware"),
        },
        linkedFiles: {
          middleware: vi.fn().mockReturnValue("linkedFiles middleware"),
        },
      };

      middleware = proxyquire(APP_ROOT + "/src/bootstrap/middleware", {
        "./session": stubs.session,
        "./feature-flag": stubs.featureFlag,
        "./linked-files": stubs.linkedFiles,
      });
    });

    it("should use session middleware", () => {
      middleware.session(app, { secret: "qwerty" });
      expect(stubs.session.middleware).toHaveBeenCalledWith({
        secret: "qwerty",
      });
      expect(app.use).toHaveBeenCalledWith("session middleware");
    });

    it("should use the feature flag setup middleware", () => {
      middleware.session(app);
      expect(stubs.featureFlag.middleware).toHaveBeenCalledWith();
      expect(app.use).toHaveBeenCalledWith("featureFlag middleware");
    });

    it("should use the linked files middleware", () => {
      middleware.session(app, { ttl: 10 });
      expect(stubs.linkedFiles.middleware).toHaveBeenCalledWith({
        ttl: 10,
      });
      expect(app.use).toHaveBeenCalledWith("linkedFiles middleware");
    });
  });

  describe("errorHandler", () => {
    let stubs;

    beforeEach(() => {
      stubs = {
        pageNotFound: {
          middleware: vi.fn().mockReturnValue("pageNotFound middleware"),
        },
        errorHandler: {
          middleware: vi.fn().mockReturnValue("errorHandler middleware"),
        },
      };

      middleware = proxyquire(APP_ROOT + "/src/bootstrap/middleware", {
        "./page-not-found": stubs.pageNotFound,
        "./error-handler": stubs.errorHandler,
      });
    });

    it("should use the pageNotFound middleware", () => {
      middleware.errorHandler(app, { foo: "bar" });
      expect(stubs.pageNotFound.middleware).toHaveBeenCalledWith({
        foo: "bar",
      });
      expect(app.use).toHaveBeenCalledWith("pageNotFound middleware");
    });

    it("should use the errorHandler middleware", () => {
      middleware.errorHandler(app, { foo: "bar" });
      expect(stubs.errorHandler.middleware).toHaveBeenCalledWith({
        foo: "bar",
      });
      expect(app.use).toHaveBeenCalledWith("errorHandler middleware");
    });
  });

  describe("listen", () => {
    beforeEach(() => {
      middleware = require(APP_ROOT + "/src/bootstrap/middleware");
    });

    it("should listen on the default host and port", () => {
      middleware.listen(app);
      expect(app.listen).toHaveBeenCalledWith(
        3000,
        "0.0.0.0",
        expect.any(Function),
      );
    });

    it("should listen on the specified host and port", () => {
      middleware.listen(app, { host: "hostname", port: 8888 });
      expect(app.listen).toHaveBeenCalledWith(
        8888,
        "hostname",
        expect.any(Function),
      );
    });
  });
});
