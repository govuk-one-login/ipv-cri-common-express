import debugLib from "debug";
import { getConfig } from "../lib/config.js";
import { resolve } from "node:path";

const debug = debugLib("hmpo-app:version");

export async function versionMiddleware({ versionFile = "version.json" } = {}) {
  let versionJSON = {};

  try {
    const filename = resolve(getConfig("APP_ROOT"), versionFile);
    versionJSON = (await import(filename, { with: { type: "json" } })).default;
  } catch (err) {
    debug("Error loading version json file", err.message);
  }

  versionJSON.appName = getConfig("APP_NAME");
  versionJSON.appVersion = getConfig("APP_VERSION");
  versionJSON.nodeVersion = process.versions.node;
  versionJSON.featureFlags = getConfig("featureFlags");

  return (req, res, _next) => res.send(versionJSON);
}
