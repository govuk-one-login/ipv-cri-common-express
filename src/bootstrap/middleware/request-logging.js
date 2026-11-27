import { randomUUID } from "node:crypto";
import onFinished from "on-finished";
import {
  getClientIp,
  getHttpDetails,
  getLogger,
  redactQueryParams,
  runWithRequestContext,
} from "../../lib/logger.js";
import { PACKAGE_NAME } from "../../lib/constants.js";

export const requestContextMiddleware = (req, res, next) => {
  req.id ??= req.get("x-request-id") ?? randomUUID();
  res.setHeader("x-request-id", req.id);
  runWithRequestContext(req, next);
};

const getLogLevel = (statusCode, aborted) => {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400 || aborted) return "warn";
  return "info";
};

export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = performance.now();
  const clientIp = getClientIp(req);

  onFinished(res, () => {
    const aborted = !res.writableEnded;
    const statusCode = res.headersSent ? res.statusCode : undefined;

    getLogger(PACKAGE_NAME)[getLogLevel(statusCode, aborted)](
      {
        http: {
          ...getHttpDetails(req),
          statusCode,
          durationMs: Math.round(performance.now() - startTime),
          location: redactQueryParams(res.getHeader("location")),
          ...(aborted && { aborted }),
        },
        clientIp,
      },
      "Request completed",
    );
  });

  next();
};
