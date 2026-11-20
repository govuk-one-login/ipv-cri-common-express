import express from "express";
import hmpoLogger from "hmpo-logger";
import pinoHttp from "pino-http";
import { urlencoded } from "body-parser";
import { getLogger } from "../lib/logger";
import { PACKAGE_NAME } from "../../lib/constants";
import { featureFlagMiddleware } from "./feature-flag";
import { healthcheckMiddleware } from "./healthcheck";
import { modelOptionsMiddleware } from "./model-options";
import { cookieMiddleware } from "./cookies";
import { sessionMiddleware } from "./session";
import { linkedFilesMiddleware } from "./linked-files";
import { pageNotFoundMiddleware } from "./page-not-found";
import { errorHandlerMiddleware } from "./error-handler";
import { versionMiddleware } from "./version";
import { setupTranslation } from "./translation";
import { setupNunjucks } from "./nunjucks";
import { setupHeaders } from "./headers";
import { publicAssetsMiddleware } from "./public";
import { fileURLToPath } from "node:url";
import { dirname, posix } from "node:path";

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
    govuk_signin_journey_id: safeReq.session?.govuk_signin_journey_id,
  };
};

const loggerMiddleware = (name = PACKAGE_NAME) =>
  pinoHttp({
    // Reuse an existing logger instance
    logger: getLogger(name),
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

export async function setupMiddlewares({
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
  let hmpoComponents = null;
  let hmpoComponentsDir = null;
  const hmpoAffectedOptions = [];
  try {
    hmpoComponentsDir = dirname(
      fileURLToPath(import.meta.resolve("hmpo-components")),
    );
    const hmpoComponentsModule = await import("hmpo-components");
    hmpoComponents = hmpoComponentsModule.default;
  } catch {
    if (views !== undefined || nunjucksOptions !== undefined) {
      hmpoAffectedOptions.push('"views"/"nunjucks"');
    }
    if (locales !== undefined || translationOptions !== undefined) {
      hmpoAffectedOptions.push('"locales"/"translation"');
    }
    if (publicOptions !== false) {
      hmpoAffectedOptions.push('"public"');
    }
  }

  urls.public = urls.public || "/public";
  urls.publicImages = urls.publicImages || posix.join(urls.public, "/images");
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
  setupHeaders(app, {
    disableCompression,
    trustProxy,
    publicPath: urls.public,
    helmet,
  });

  // version, healthcheck
  if (urls.version) app.get(urls.version, await versionMiddleware());
  if (urls.healthcheck) app.get(urls.healthcheck, healthcheckMiddleware());

  // public static assets
  if (publicOptions !== false) {
    app.use(
      publicAssetsMiddleware({
        urls,
        publicDirs,
        publicImagesDirs,
        public: publicOptions,
        hmpoComponentsDir,
      }),
    );
  }

  app.use(featureFlagMiddleware({ featureFlags }));
  app.use(cookieMiddleware(cookieOptions));
  app.use(modelOptionsMiddleware(modelOptionsConfig));
  app.use(urlencoded({ extended: true }));

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

  const nunjucksEnv = setupNunjucks(app, {
    views,
    hmpoComponentsDir,
    ...nunjucksOptions,
  });

  const hmpoI18nRequired =
    translationOptions !== false &&
    locales !== false &&
    (locales != null || translationOptions != null);

  if (hmpoI18nRequired) {
    await setupTranslation(app, {
      locales,
      hmpoComponentsDir,
      ...translationOptions,
    });
  }

  if (hmpoComponents) {
    hmpoComponents.setup(app, nunjucksEnv);
  }

  if (hmpoAffectedOptions.length > 0) {
    getLogger(PACKAGE_NAME).info(
      `'hmpo-components' is not installed so additional setup has not been applied for: ${hmpoAffectedOptions.join(", ")}.`,
    );
  }

  return app;
}

export function setupSessionMiddlewares(
  app = requiredArgument("app"),
  sessionOptions,
) {
  app.use(sessionMiddleware(sessionOptions));
  app.use(featureFlagMiddleware());
  app.use(linkedFilesMiddleware(sessionOptions));
}

export function setupErrorHandlerMiddlewares(
  app = requiredArgument("app"),
  errorHandleroptions,
) {
  app.use(pageNotFoundMiddleware(errorHandleroptions));
  app.use(errorHandlerMiddleware(errorHandleroptions));
}

export function listen(
  app = requiredArgument("app"),
  { port = 3000, host = "0.0.0.0" } = {},
) {
  app.listen(port, host, () => {
    getLogger(PACKAGE_NAME).info("Listening on http://:listen", {
      bind: host,
      port,
      listen: (host === "0.0.0.0" ? "localhost" : host) + ":" + port,
    });
  });
}
