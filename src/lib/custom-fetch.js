import { PACKAGE_NAME } from "./constants";
import { getLogger, redactQueryParams } from "../bootstrap/lib/logger";
import { extractIpAddress } from "./user-ip-address";

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

function logDnsError(dnsError, error, { req, method, url }) {
  const details = {
    errorCode: dnsError.code,
    errorMessage: dnsError.message,
    syscall: dnsError.syscall,
    hostname: dnsError.hostname,
    method,
    url: redactQueryParams(url),
  };

  const logger = getLogger(PACKAGE_NAME);

  if (process.env.USE_PINO_LOGGER === "true") {
    logger.error({ ...details, req, err: error }, DNS_ERROR_LOG_MESSAGE);
  } else {
    logger.error(DNS_ERROR_LOG_MESSAGE, { ...details, req, err: error });
  }
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

    getLogger(PACKAGE_NAME).info("API request", {
      config: {
        baseURL: baseUrl,
        method,
        timeout: options?.timeoutMs,
      },
      req,
    });

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

    let response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers: { ...fetchOptions?.headers, ...reqDerivedHeaders },
      });
    } catch (error) {
      const dnsError = findDnsError(error);
      if (dnsError) logDnsError(dnsError, error, { req, method, url });
      throw error;
    }

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
