import type { Request, Response, NextFunction, Express } from "express";
import { type HelmetOptions } from "helmet";

import path from "node:path";
import express from "express";
import bodyParser from "body-parser";
import hmpoLogger from "hmpo-logger";
import pinoHttp from "pino-http";
// @ts-expect-error no types available
import hmpoComponents from "hmpo-components";

import * as logger from "../lib/logger";
import * as healthcheck from "./healthcheck";
import * as modelOptions from "./model-options";
import * as featureFlag from "./feature-flag";
import * as version from "./version";
import * as cookies from "./cookies";
import * as translation from "./translation";
import * as publicMiddleware from "./public";
import * as nunjucks from "./nunjucks";
import * as headers from "./headers";
import * as session from "./session";
import * as linkedFiles from "./linked-files";
import * as pageNotFound from "./page-not-found";
import * as errorHandler from "./error-handler";

const requiredArgument = (argName: string) => {
  throw new Error(`Argument '${argName}' must be specified`);
};

const HANDLED_ERROR = new Error(
  "Placeholder errors that do not require additional logging",
);

const generateRequestId = (req: Request, res: Response) => {
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

const addRequestContext = (req: Request, _: Response, val: Record<string, unknown>) => {
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

type Urls = {
  public?: string;
  publicImages?: string;
  version?: string | false;
  healthcheck?: string | false;
};

type SetupOptions = {
  env?: string;
  urls?: Urls;
  featureFlags?: Record<string, boolean>;
  publicDirs?: unknown;
  publicImagesDirs?: unknown;
  public?: unknown;
  disableCompression?: boolean;
  trustProxy?: boolean;
  requestLogging?: boolean;
  helmet?: HelmetOptions;
  views?: unknown;
  locales?: unknown;
  nunjucks?: Record<string, unknown>;
  translation?: Record<string, unknown>;
  modelOptions?: unknown;
  cookies?: unknown;
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
    customSuccessMessage: (_: Request, res: Response) =>
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
  }: SetupOptions = {}) {
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
      helmetOptions: helmet,
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

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.baseUrl = req.baseUrl;
      next();
    });

    const nunjucksEnv = nunjucks.setup(app, { views, ...nunjucksOptions });
    translation.setup(app, { locales, ...translationOptions });
    hmpoComponents.setup(app, nunjucksEnv);

    return app;
  },

  session(app: Express = requiredArgument("app"), sessionOptions: Record<string, unknown>) {
    app.use(session.middleware(sessionOptions));
    app.use(featureFlag.middleware());
    app.use(linkedFiles.middleware(sessionOptions));
  },

  errorHandler(app: Express = requiredArgument("app"), errorHandleroptions: Record<string, unknown>) {
    app.use(pageNotFound.middleware(errorHandleroptions));
    app.use(errorHandler.middleware(errorHandleroptions));
  },

  listen(
    app: Express = requiredArgument("app"),
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

export default middleware;
