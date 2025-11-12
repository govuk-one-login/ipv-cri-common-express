const pino = require("pino");
const config = require("./config");
const { PACKAGE_NAME } = require("../../lib/constants");

const setup = (options = config.get("logs", {})) => pino.config(options);

const loggers = new Map();

const get = (name) => {
  if (loggers.has(name)) return loggers.get(name);

  const logger = pino({
    name: PACKAGE_NAME,
    level: process.env.LOGS_LEVEL ?? "info",
    messageKey: "message", // rename default msg property to message,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
  });

  loggers.set(name, logger);

  return logger;
};

const middleware = (name) => {
  return (req, res, next) => {
    try {
      const log = get(name);
      log.info(":clientip :verb :request", { req });
    } catch (e) {
      // swallow logging errors in middleware
    }

    next();
  };
};

module.exports = Object.assign(get, {
  setup,
  get,
  middleware,
});
