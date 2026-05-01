import type { Request, Response } from "express";

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
  (_req: Request, res: Response) => {
    let id = os.hostname();

    if (process.env.pm_id) {
      id += "-" + process.env.pm_id;
    }

    const status: HealthStatus = {
      appName: config.get("APP_NAME") as string,
      version: config.get("APP_VERSION") as string,
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

export { middleware };
