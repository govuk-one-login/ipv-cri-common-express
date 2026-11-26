import express from "express";
import overloadProtectionLib from "overload-protection";
import { getConfig, setupConfig } from "./lib/config.js";
import {
  setupMiddlewares,
  listen,
  setupSessionMiddlewares,
  setupErrorHandlerMiddlewares,
} from "./middleware/index.js";
import { notFoundFallback } from "./middleware/public.js";
import { setupRedisClient } from "./lib/redis-client.js";
import { configureOverloadProtection } from "./lib/overload-protection.js";
import { buildCsrfMiddleware } from "../lib/csrf/index.js";

export const appSetup = async (
  options = {
    middlewareSetupFn: undefined,
    overloadProtection: undefined,
  },
) => {
  const protect = overloadProtectionLib(
    "express",
    configureOverloadProtection(options.overloadProtection),
  );

  if (options.config !== false) setupConfig(options.config);

  if (options.redis != null && options.redis !== false)
    setupRedisClient({
      ...getConfig("redis"),
      ...options.redis,
    });

  const app = await setupMiddlewares({
    ...getConfig(),
    ...options,
  });

  if (
    options.middlewareSetupFn &&
    typeof options.middlewareSetupFn === "function"
  ) {
    options.middlewareSetupFn(app);
  }

  const staticRouter = express.Router();
  staticRouter.use(protect);
  app.use(staticRouter);

  if (options.public !== false) {
    app.use(notFoundFallback({ urls: app.locals.urls }));
  }

  if (options.session !== false)
    setupSessionMiddlewares(app, {
      ...getConfig("session"),
      ...options.session,
    });

  if (options.csrf) {
    app.use(buildCsrfMiddleware(options.csrf));
  }

  const router = express.Router();
  router.use(protect);
  app.use(router);

  const errorRouter = express.Router();
  errorRouter.use(protect);
  app.use(errorRouter);

  if (options.errors !== false)
    setupErrorHandlerMiddlewares(app, {
      ...getConfig("errors"),
      ...options.errors,
    });

  if (options.port != null && options.port !== false)
    listen(app, {
      port: options.port || getConfig("port"),
      host: options.host || getConfig("host"),
    });

  return { app, staticRouter, router, errorRouter };
};
