import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";
import { PACKAGE_NAME } from "./constants.js";

const pinoLoggers = new Map();
const requestStore = new AsyncLocalStorage();

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

const splitStack = (stack) =>
  typeof stack === "string" ? stack.split(/[\n\r]+/) : undefined;

const summariseCause = (cause) =>
  cause && typeof cause === "object"
    ? { name: cause.name, code: cause.code, message: cause.message }
    : undefined;

export const serialiseError = (err, { stack = true } = {}) => {
  if (!err || typeof err !== "object") return undefined;
  return {
    name: err.name,
    code: err.code,
    status: err.status,
    message: err.message,
    stack: stack ? splitStack(err.stack) : undefined,
    cause: summariseCause(err.cause),
  };
};

const serialiseIfError = (err) =>
  err instanceof Error ? serialiseError(err) : err;

// 4xx errors are expected conditions (e.g. CSRF failure, page not found) and are logged at info
// CustomFetchHttpError stores the API's status on `code` (not `status`) so a 4xx from a backend is still logged at error
export const isClientError = (err) => err?.status >= 400 && err?.status < 500;

// correlation IDs for linking a log line to a user journey
export const getRequestContext = (req) => ({
  requestId: req?.id,
  sessionId: req?.session?.id,
  ipvSessionId: req?.session?.ipvSessionId,
  govukSigninJourneyId: req?.session?.govuk_signin_journey_id,
  context: req?.session?.context,
});

export const getClientIp = (req) => req?.ip ?? req?.connection?.remoteAddress;

export const getHttpDetails = (req) => ({
  method: req?.method,
  path: redactQueryParams(req?.originalUrl || req?.url),
});

// make the request context available to every logger (including loggers created by the fronts)
export const runWithRequestContext = (req, fn) => requestStore.run(req, fn);

export const getLogger = (name = PACKAGE_NAME) => {
  if (pinoLoggers.has(name)) {
    return pinoLoggers.get(name);
  }
  let newPinoLogger = pino({
    name,
    level: process.env.LOG_LEVEL ?? "info",
    messageKey: "message", // rename default msg property to message,
    errorKey: "error", // log errors passed directly (e.g. logger.error(err, "msg")) under error, not err
    base: { name },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
    mixin: () => getRequestContext(requestStore.getStore()),
    serializers: {
      error: serialiseIfError,
      err: serialiseIfError, // also handle pino's default err key just in case
    },
  });
  pinoLoggers.set(name, newPinoLogger);
  return newPinoLogger;
};

export function logError(req, err, { message = "Request error", fields } = {}) {
  const clientError = isClientError(err);

  getLogger(PACKAGE_NAME)[clientError ? "info" : "error"](
    {
      ...fields,
      error: serialiseError(err, { stack: !clientError }),
      http: getHttpDetails(req),
    },
    message,
  );
}
