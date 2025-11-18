const path = require("path");
const express = require("express");
const logger = require("../lib/logger");
const hmpoLogger = require("hmpo-logger");
const pinoHttp = require("pino-http");

const requiredArgument = (argName) => {
  throw new Error(`Argument '${argName}' must be specified`);
};

const HANDLED_ERROR = new Error(
  "Placeholder errors that do not require additional logging",
);

const generateRequestId = (req, res) => {
  const existingId = req?.id ?? req?.get?.("x-request-id");
  if (existingId) {
    return existingId;
  }
  if (!res) return undefined;
  // Not securely random, but this is just used for request correlation
  const newId = Math.random().toString(36).slice(2);
  // guard res.header existence
  if (typeof res.header === "function") {
    res.header("x-request-id", newId);
  } else if (typeof res.setHeader === "function") {
    res.setHeader("x-request-id", newId);
  }
  return newId;
};

const addRequestContext = (req, res, val) => {
  const safeReq = req || {};
  const safeVal = val || {};
  return {
    ...safeVal,
    requestId: safeReq.id ?? undefined,
    ipvSessionId: safeReq.session?.ipvSessionId,
    sessionId: safeReq.session?.id,
    context: safeReq.session?.context ?? undefined,
  };
};

const loggerMiddleware = (name = ":hmpo-app") =>
  pinoHttp({
    // Reuse an existing logger instance
    logger: logger.get(name),
    // Define a custom request id function, this will be assigned to req.id
    genReqId: generateRequestId,
    // Set to `false` to prevent standard serializers from being wrapped.
    wrapSerializers: false,
    // Define a custom receive message
    customReceivedMessage: (req) => `REQUEST RECEIVED: ${req.method}`,
    customReceivedObject: addRequestContext,
    customErrorMessage: (req, res) =>
      `REQUEST FAILED WITH STATUS CODE: ${res.statusCode}`,
    customErrorObject: (req, res, error, val) => {
      // Ignore errors that have already been handled by the error handler
      if (val.err === HANDLED_ERROR) {
        delete val.err;
      }

      return addRequestContext(req, res, val);
    },
    customSuccessMessage: (req, res) =>
      `REQUEST ${res.statusCode >= 400 ? "FAILED" : "COMPLETED"} WITH STATUS CODE OF: ${res.statusCode}`,
    customSuccessObject: addRequestContext,
    customAttributeKeys: {
      responseTime: "timeTaken",
    },
    // Define a custom logger level
    customLogLevel: () => "info",
  });

const middleware = {
  setup({
    env = process.env.NODE_ENV,
    urls = {},
    featureFlags,
    publicDirs,
    publicImagesDirs,
    public: publicOptions,
    disableCompression = false,
    trustProxy = true,
    requestLogging = true,
    helmet,
    views,
    locales,
    nunjucks: nunjucksOptions,
    translation: translationOptions,
    modelOptions: modelOptionsConfig,
    cookies: cookieOptions,
  } = {}) {
    const healthcheck = require("./healthcheck");
    const modelOptions = require("./model-options");
    const featureFlag = require("./feature-flag");
    const version = require("./version");
    const cookies = require("./cookies");
    const bodyParser = require("body-parser");
    const translation = require("./translation");
    const hmpoComponents = require("hmpo-components");
    const publicMiddleware = require("./public");
    const nunjucks = require("./nunjucks");
    const headers = require("./headers");

    urls.public = urls.public || "/public";
    urls.publicImages =
      urls.publicImages || path.posix.join(urls.public, "/images");
    urls.version = urls.version === undefined ? "/version" : urls.version;
    urls.healthcheck =
      urls.healthcheck === undefined ? "/healthcheck" : urls.healthcheck;

    // create new express app
    const app = express();

    // environment
    env = (env || "development").toLowerCase();
    app.set("env", env);
    app.set("dev", env !== "production");

    // security and headers
    headers.setup(app, {
      disableCompression,
      trustProxy,
      publicPath: urls.public,
      helmet,
    });

    // version, healthcheck
    if (urls.version) app.get(urls.version, version.middleware());
    if (urls.healthcheck) app.get(urls.healthcheck, healthcheck.middleware());

    // public static assets
    if (publicOptions !== false)
      app.use(
        publicMiddleware.middleware({
          urls,
          publicDirs,
          publicImagesDirs,
          public: publicOptions,
        }),
      );

    app.use(featureFlag.middleware({ featureFlags }));
    app.use(cookies.middleware(cookieOptions));
    app.use(modelOptions.middleware(modelOptionsConfig));
    app.use(bodyParser.urlencoded({ extended: true }));

    // logging
    if (requestLogging) {
      if (process.env.USE_PINO_LOGGER !== "true") {
        app.use(hmpoLogger.middleware(":request"));
      } else {
        app.use(loggerMiddleware());
      }
    }

    Object.assign(app.locals, {
      baseUrl: "/",
      assetPath: urls.public,
      urls: urls,
    });

    app.use((req, res, next) => {
      res.locals.baseUrl = req.baseUrl;
      next();
    });

    const nunjucksEnv = nunjucks.setup(app, { views, ...nunjucksOptions });
    translation.setup(app, { locales, ...translationOptions });
    hmpoComponents.setup(app, nunjucksEnv);

    return app;
  },

  session(app = requiredArgument("app"), sessionOptions) {
    const session = require("./session");
    const featureFlag = require("./feature-flag");
    const linkedFiles = require("./linked-files");

    app.use(session.middleware(sessionOptions));
    app.use(featureFlag.middleware());
    app.use(linkedFiles.middleware(sessionOptions));
  },

  errorHandler(app = requiredArgument("app"), errorHandleroptions) {
    const pageNotFound = require("./page-not-found");
    const errorHandler = require("./error-handler");

    app.use(pageNotFound.middleware(errorHandleroptions));
    app.use(errorHandler.middleware(errorHandleroptions));
  },

  listen(
    app = requiredArgument("app"),
    { port = 3000, host = "0.0.0.0" } = {},
  ) {
    app.listen(port, host, () => {
      logger.get().info("Listening on http://:listen", {
        bind: host,
        port,
        listen: (host === "0.0.0.0" ? "localhost" : host) + ":" + port,
      });
    });
  },
};

module.exports = middleware;
