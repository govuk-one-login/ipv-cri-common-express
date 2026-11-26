import hmpoLogger from "hmpo-logger";
import { getConfig } from "./config.js";
import pino from "pino";
import { PACKAGE_NAME } from "../../lib/constants.js";

const pinoLoggers = new Map();

const SENSITIVE_PARAMS = ["request", "code"];
const BASE_PLACEHOLDER = "https://placeholder-for-redaction";

export const redactQueryParams = (url) => {
  if (url?.includes("?")) {
    try {
      const parsedUrl = new URL(url, BASE_PLACEHOLDER);
      for (const param of SENSITIVE_PARAMS) {
        if (parsedUrl.searchParams.has(param)) {
          parsedUrl.searchParams.set(param, "hidden");
        }
      }
      return parsedUrl.href.replace(BASE_PLACEHOLDER, "");
    } catch {
      // ignore
    }
  }
  return url;
};

const getErrorProperties = (err) => {
  const properties = {};
  for (const key of Object.keys(err)) {
    const value = err[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      properties[key] = value;
    }
  }
  return properties;
};

const splitStack = (stack) =>
  typeof stack === "string" ? stack.split(/[\n\r]+/) : undefined;

const serializeError = (err) => {
  const serialized = {
    ...getErrorProperties(err),
    type: err.name,
    message: err.message,
    stack: err.stack,
  };
  if (err.original) {
    serialized.original =
      err.original instanceof Error
        ? {
            ...getErrorProperties(err.original),
            type: err.original.name,
            message: err.original.message,
            stack: err.original.stack,
          }
        : err.original;
  }
  return serialized;
};

export const setupLogger = (options = getConfig("logs", {})) =>
  hmpoLogger.config(options);

export const getLogger = (name = ":hmpo-app", level = 1) => {
  if (process.env.USE_PINO_LOGGER !== "true") {
    return hmpoLogger.get(name, level + 1);
  }
  if (pinoLoggers.has(name)) {
    return pinoLoggers.get(name);
  }
  let newPinoLogger = pino({
    name,
    level: process.env.LOG_LEVEL ?? "info",
    messageKey: "message", // rename default msg property to message,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
    serializers: {
      req: (req) => {
        return {
          method: req.method,
          url: redactQueryParams(req.url),
          clientip: req.ip ?? req.connection?.remoteAddress,
          remoteAddress: req.connection?.remoteAddress,
          hostname: req.hostname,
          httpversion:
            req.httpVersionMajor && req.httpVersionMinor
              ? `${req.httpVersionMajor}.${req.httpVersionMinor}`
              : undefined,
          uniqueID: req.headers?.["x-uniq-id"],
        };
      },
      res: (res) => {
        return {
          statusCode: res.statusCode,
          sessionId: res.locals.sessionId,
          location: redactQueryParams(res.getHeader("location")),
          bytes: res.getHeader("content-length"),
        };
      },
      err: serializeError,
    },
  });
  pinoLoggers.set(name, newPinoLogger);
  return newPinoLogger;
};

export function logError(req, err, options = {}) {
  const { messagePrefix, logger = getLogger(PACKAGE_NAME) } = options;

  if (process.env.USE_PINO_LOGGER === "true") {
    const message = messagePrefix
      ? `${messagePrefix}: ${err.message}`
      : err.message;

    logger.error({
      ...getErrorProperties(err),
      stack: splitStack(err.stack),
      ...(err.original && {
        original:
          err.original instanceof Error
            ? serializeError(err.original)
            : err.original,
      }),
      clientip: req.ip ?? req.connection?.remoteAddress,
      sessionID: req.sessionID,
      method: req.method,
      request: redactQueryParams(req.originalUrl || req.url),
      message,
      err,
    });
  } else {
    const baseMessage = ":clientip :verb :request :err.message";
    const message = messagePrefix
      ? `${messagePrefix}: ${baseMessage}`
      : baseMessage;
    logger.error(message, { req, err });
  }
}
