import type { Request, Response } from "express";
import pino from "pino";
import hmpoLogger from "hmpo-logger";
import * as config from "./config.js";

const pinoLoggers = new Map<string, pino.Logger>();

const SENSITIVE_PARAMS = ["request", "code"];
const BASE_PLACEHOLDER = "https://placeholder-for-redaction";

const redactQueryParams = (url: string): string => {
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

const setup = (options = config.get("logs", {})): void =>
  hmpoLogger.config(options);

const get = (name = ":hmpo-app", level = 1) => {
  if (process.env.USE_PINO_LOGGER !== "true") {
    return hmpoLogger.get(name, ++level);
  }
  const existing = pinoLoggers.get(name);
  if (existing) {
    return existing;
  }
  const newPinoLogger = pino({
    name,
    level: process.env.LOGS_LEVEL ?? "info",
    messageKey: "message", // rename default msg property to message,
    formatters: {
      level(label: string) {
        return { level: label.toUpperCase() };
      },
    },
    serializers: {
      req: (req: Request) => ({
        method: req.method,
        url: redactQueryParams(req.url),
      }),
      res: (res: Response) => ({
        statusCode: res.statusCode,
        sessionId: res.locals.sessionId,
        location: redactQueryParams(res.getHeader("location") as string),
      }),
    },
  });
  pinoLoggers.set(name, newPinoLogger);
  return newPinoLogger;
};

export { setup, get, redactQueryParams };
