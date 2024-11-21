const axios = require("axios");
const logger = require("hmpo-logger");
const userIpAddress = require("./user-ip-address");
const { PACKAGE_NAME } = require("./constants");

module.exports = function (req, res, next) {
  const baseURL = req.app.get("API.BASE_URL");

  if (!baseURL) {
    next(new Error("Missing API.BASE_URL value"));
  }

  req.axios = axios.create({
    baseURL,
  });

  // Add a request interceptor
  req.axios.interceptors.request.use(function (config) {
    logger.get(PACKAGE_NAME).info("API request", {
      config: {
        baseURL: config.baseURL,
        method: config.method,
        timeout: config.timeout,
      },
      req,
    });

    return config;
  });

  if (req.scenarioIDHeader && req.axios?.defaults?.headers?.common) {
    req.axios.defaults.headers.common["x-scenario-id"] = req.scenarioIDHeader;
  }

  if (req?.headers["forwarded"] && req.axios?.defaults?.headers?.common) {
    const ipAddress = userIpAddress(req.headers["forwarded"]);
    if (ipAddress) {
      req.axios.defaults.headers.common["x-forwarded-for"] = ipAddress;
    }
  }

  next();
};
