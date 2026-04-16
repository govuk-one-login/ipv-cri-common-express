import type { Request, Response, NextFunction } from "express";

import os from "node:os";
import * as config from "../lib/config";

type HealthStatus = {
  appName: string;
  version: string;
  id: string;
  uptime: number;
  status?: string;
  error?: {
    message: string;
    code?: string;
  };
};

const middleware =
  ({ healthFn }: { healthFn?: (status: HealthStatus) => unknown } = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    let id = os.hostname();

    if (process.env.pm_id) {
      id += "-" + process.env.pm_id;
    }

    let status: HealthStatus = {
      appName: config.get("APP_NAME"),
      version: config.get("APP_VERSION"),
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
        .catch((err: Error & { code?: string }) => {
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

module.exports = {
  middleware,
};
