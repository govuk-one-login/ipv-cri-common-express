import express from "express";
import bodyParser from "body-parser";
import { getLogger } from "../../lib/logger.js";
import { PACKAGE_NAME } from "../../lib/constants.js";
import { featureFlagMiddleware } from "./feature-flag.js";
import { healthcheckMiddleware } from "./healthcheck.js";
import { modelOptionsMiddleware } from "./model-options.js";
import { cookieMiddleware } from "./cookies.js";
import { sessionMiddleware } from "./session.js";
import { linkedFilesMiddleware } from "./linked-files.js";
import { pageNotFoundMiddleware } from "./page-not-found.js";
import { errorHandlerMiddleware } from "./error-handler.js";
import { versionMiddleware } from "./version.js";
import {
  requestContextMiddleware,
  requestLoggingMiddleware,
} from "./request-logging.js";
import { setupTranslation } from "./translation.js";
import { setupNunjucks } from "./nunjucks.js";
import { setupHeaders } from "./headers.js";
import { publicAssetsMiddleware } from "./public.js";
import { fileURLToPath } from "node:url";
import { dirname, posix } from "node:path";

const requiredArgument = (argName) => {
  throw new Error(`Argument '${argName}' must be specified`);
};

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
  app.use(bodyParser.urlencoded({ extended: true }));

  // logging
  app.use(requestContextMiddleware);
  if (requestLogging) {
    app.use(requestLoggingMiddleware);
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
    const address = (host === "0.0.0.0" ? "localhost" : host) + ":" + port;
    getLogger(PACKAGE_NAME).info(
      { bind: host, port },
      `Listening on http://${address}`,
    );
  });
}
