import { hostname } from "node:os";
import { getConfig } from "../lib/config";

export const healthcheckMiddleware =
  ({ healthFn } = {}) =>
  (req, res, _next) => {
    let id = hostname();

    if (process.env.pm_id) {
      id += "-" + process.env.pm_id;
    }

    let status = {
      appName: getConfig("APP_NAME"),
      version: getConfig("APP_VERSION"),
      id: id,
      uptime: process.uptime(),
    };

    const response = () => {
      status.status =
        status.status || status.error?.code || status.error?.message || "OK";
      res.setHeader("Connection", "close");
      res.status(status.status === "OK" ? 200 : 500).json(status);
    };

    let promise;
    if (healthFn) promise = healthFn(status);
    if (promise instanceof Promise) {
      promise
        .catch((err) => {
          status.error = {
            message: err.message,
            code: err.code,
          };
        })
        .finally(response);
    } else {
      response();
    }
  };
