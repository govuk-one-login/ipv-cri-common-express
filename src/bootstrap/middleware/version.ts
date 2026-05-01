import type { Request, Response, NextFunction } from "express";

import createDebug from "debug";
import * as config from "../lib/config";
import path from "node:path";

const debug = createDebug("hmpo-app:version");

const middleware = ({ versionFile = "version.json" } = {}) => {
  let versionJSON = {};

  try {
    const filename = path.resolve(config.get("APP_ROOT"), versionFile);
    versionJSON = require(filename);
  } catch (err) {
    debug("Error loading version json file", err.message);
  }

  versionJSON.appName = config.get("APP_NAME");
  versionJSON.appVersion = config.get("APP_VERSION");
  versionJSON.nodeVersion = process.versions.node;
  versionJSON.featureFlags = config.get("featureFlags");

  return (req: Request, res: Response, next: NextFunction) =>
    res.send(versionJSON);
};

export { middleware };
