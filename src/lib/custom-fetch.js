const { PACKAGE_NAME } = require("./constants");
const logger = require("../bootstrap/lib/logger");
const extractIpAddress = require("./user-ip-address");

class CustomFetchHttpError extends Error {
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

    logger.get(PACKAGE_NAME).info("API request", {
      config: {
        baseURL: baseUrl,
        method: options?.method ?? "GET",
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

    const response = await fetch(`${baseUrl}${path}`, {
      ...fetchOptions,
      headers: { ...fetchOptions?.headers, ...reqDerivedHeaders },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new CustomFetchHttpError(response, body);
    }

    return response;
  };
}

function customFetchMiddleware(req, res, next) {
  try {
    req.customFetch = buildFetchWithReq(req);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  customFetchMiddleware,
  CustomFetchHttpError,
};
