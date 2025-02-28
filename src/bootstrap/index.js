const express = require("express");
const config = require("./lib/config");
const logger = require("./lib/logger");
const middleware = require("./middleware");
const redisClient = require("./lib/redis-client");

const setup = (
  options = {
    middlewareSetupFn: undefined,
  },
) => {
  const protectConfig = {
    production: process.env.NODE_ENV === "production", // if production is false, detailed error messages are exposed to the client
    clientRetrySecs: 1, // Retry-After header, in seconds (0 to disable) [default 1]
    sampleInterval: 5, // sample rate, milliseconds [default 5]
    maxEventLoopDelay: process.env.MAX_EVENT_LOOP_DELAY || 500, // maximum detected delay between event loop ticks [default 42]
    maxHeapUsedBytes: 0, // maximum heap used threshold (0 to disable) [default 0]
    maxRssBytes: 0, // maximum rss size threshold (0 to disable) [default 0]
    errorPropagationMode: false, // dictate behavior: take over the response
    // or propagate an error to the framework [default false]
    logging: false, // set to string for log level or function to pass data to
    logStatsOnReq: false, // set to true to log stats on every requests
  };
  const protect = require("overload-protection")("express", protectConfig);

  if (options.config !== false) config.setup(options.config);

  if (options.logs !== false)
    logger.setup({
      ...config.get("logs"),
      ...options.logs,
    });

  if (options.redis !== false)
    redisClient.setup({
      ...config.get("redis"),
      ...options.redis,
    });

  const app = middleware.setup({
    ...config.get(),
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

  if (options.session !== false)
    middleware.session(app, {
      ...config.get("session"),
      ...options.session,
    });

  const router = express.Router();
  router.use(protect);
  app.use(router);

  const errorRouter = express.Router();
  errorRouter.use(protect);
  app.use(errorRouter);

  if (options.errors !== false)
    middleware.errorHandler(app, {
      ...config.get("errors"),
      ...options.errors,
    });

  if (options.port !== false)
    middleware.listen(app, {
      port: options.port || config.get("port"),
      host: options.host || config.get("host"),
    });

  return { app, staticRouter, router, errorRouter };
};

module.exports = {
  setup,
  middleware,
  config,
  logger,
  redisClient,
  translation: require("./middleware/translation"),
  nunjucks: require("./middleware/nunjucks"),
  linkedFiles: require("./middleware/linked-files"),
  featureFlag: require("./middleware/feature-flag"),
};
