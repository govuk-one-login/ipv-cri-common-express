import { PACKAGE_NAME } from "./constants.js";
import { getLogger, logError, redactQueryParams } from "./logger.js";
import { extractIpAddress } from "./user-ip-address.js";

export const DNS_ERROR_LOG_MESSAGE = "API request DNS resolution failure";
const DNS_ERROR_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);
const MAX_ERRORS_INSPECTED = 20;

function findDnsError(error) {
  const seen = new Set();
  const queue = [error];
  let inspected = 0;

  while (queue.length > 0 && inspected < MAX_ERRORS_INSPECTED) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;

    seen.add(current);
    inspected++;

    if (DNS_ERROR_CODES.has(current.code)) return current;

    if (current.cause) queue.push(current.cause);
    if (Array.isArray(current.errors)) queue.push(...current.errors);
  }

  return undefined;
}

function logRequestFailure(req, error, api) {
  const dnsError = findDnsError(error);
  logError(req, error, {
    message: dnsError ? DNS_ERROR_LOG_MESSAGE : "API request failed",
    fields: {
      api,
      ...(dnsError && {
        dns: {
          code: dnsError.code,
          syscall: dnsError.syscall,
          hostname: dnsError.hostname,
        },
      }),
    },
  });
}

export class CustomFetchHttpError extends Error {
  constructor(response, bodyString) {
    super(`Response not OK: ${response.statusText}`);
    this.code = response.status;
    this.body = bodyString;
    this.headers = response.headers;
  }
}

function buildFetchWithReq(req) {
  const baseUrl = req.app.get("API.BASE_URL");
  if (!baseUrl) throw new Error("Missing API.BASE_URL value");

  const reqDerivedHeaders = {
    ...(req.scenarioIDHeader
      ? {
          "x-scenario-id": req.scenarioIDHeader,
        }
      : {}),
    ...(req.headers?.["forwarded"]
      ? { "x-forwarded-for": extractIpAddress(req.headers["forwarded"]) }
      : {}),
  };

  return async function customFetch(path, options) {
    if (!path.startsWith("/"))
      throw new Error(`Given path should start with '/'`);

    const method = options?.method ?? "GET";

    const logger = getLogger(PACKAGE_NAME);
    const api = {
      method,
      path: redactQueryParams(path),
      timeoutMs: options?.timeoutMs,
    };

    logger.debug({ api }, "API request");

    const fetchOptions = {
      ...options,
    };

    if (typeof fetchOptions?.timeoutMs === "number") {
      fetchOptions.signal = AbortSignal.timeout(fetchOptions.timeoutMs);
      delete fetchOptions.timeoutMs;
    }

    if (fetchOptions?.jsonBody !== undefined) {
      fetchOptions.body = JSON.stringify(fetchOptions.jsonBody);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Content-Type": "application/json",
      };
      delete fetchOptions.jsonBody;
    }

    const url = `${baseUrl}${path}`;

    const startTime = performance.now();
    const getDurationMs = () => Math.round(performance.now() - startTime);
    let response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers: { ...fetchOptions?.headers, ...reqDerivedHeaders },
      });
    } catch (error) {
      logRequestFailure(req, error, {
        ...api,
        durationMs: getDurationMs(),
      });
      throw error;
    }

    logger[response.ok ? "info" : "warn"](
      {
        api: {
          ...api,
          statusCode: response.status,
          durationMs: getDurationMs(),
        },
      },
      "API response",
    );

    if (!response.ok) {
      const body = await response.text();
      throw new CustomFetchHttpError(response, body);
    }

    return response;
  };
}

export function customFetchMiddleware(req, res, next) {
  try {
    req.customFetch = buildFetchWithReq(req);
    next();
  } catch (error) {
    next(error);
  }
}
