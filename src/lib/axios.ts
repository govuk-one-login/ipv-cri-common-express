import type {Request, Response, NextFunction} from "express";
import axios from "axios"
import * as logger from "../bootstrap/lib/logger"
import userIpAddress from "./user-ip-address"
import constants from "./constants"

const request = (req: Request, res: Response, next: NextFunction) => {
  const baseURL = req.app.get("API.BASE_URL");

  if (!baseURL) {
    next(new Error("Missing API.BASE_URL value"));
  }

  req.axios = axios.create({
    baseURL,
  });

  // Add a request interceptor
  req.axios.interceptors.request.use(function (config) {
    logger.get(constants.PACKAGE_NAME).info("API request", {
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

export {
  request
}
