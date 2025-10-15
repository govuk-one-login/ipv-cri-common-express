const pino = require("pino");
const config = require("./config");
const { PACKAGE_NAME } = require("../../lib/constants");

const setup = (options = config.get("logs", {})) => pino.config(options);

const loggers = new Map();

const get = (name, level = 1) => {
  if (loggers.has(name)) return loggers.get(name);

  const logger = pino({
    name: PACKAGE_NAME,
    level: process.env.LOGS_LEVEL ?? "info",
    messageKey: "message", // rename default msg property to message,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    }
  });

  loggers.set(name, logger);

  return logger;
};

module.exports = Object.assign(get, {
  setup,
  get,
});

