import { getConfig } from "../lib/config.js";
import { resolve } from "node:path";
import { PACKAGE_NAME } from "../../lib/constants.js";
import { getLogger } from "../lib/logger.js";

export async function versionMiddleware({ versionFile = "version.json" } = {}) {
  let versionJSON = {};

  try {
    const filename = resolve(getConfig("APP_ROOT"), versionFile);
    versionJSON = (await import(filename, { with: { type: "json" } })).default;
  } catch (err) {
    getLogger(PACKAGE_NAME).debug(
      { errorMessage: err.message },
      "Error loading version json file",
    );
  }

  versionJSON.appName = getConfig("APP_NAME");
  versionJSON.appVersion = getConfig("APP_VERSION");
  versionJSON.nodeVersion = process.versions.node;
  versionJSON.featureFlags = getConfig("featureFlags");

  return (req, res, _next) => res.send(versionJSON);
}
