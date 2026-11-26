import HmpoConfig from "hmpo-config";
import { PACKAGE_NAME } from "../../lib/constants.js";
import { getLogger } from "./logger.js";

const logger = getLogger(PACKAGE_NAME);

export const defaultFiles = [
  "config/default.json",
  "config/default.yaml",
  "config/default.yml",
];
export const setupConfig = ({
  APP_ROOT,
  seed,
  files = defaultFiles,
  envVarName = "HMPO_CONFIG",
  commandLineSwitch = "-c",
  merge = true,
  _commandLineArgs = process.argv,
  _environmentVariables = process.env,
} = {}) => {
  const config = new HmpoConfig(APP_ROOT);

  if (seed) {
    logger.debug("Merging with previous config");
    config.addConfig(seed);
  }

  if (!seed && merge && globalThis.GLOBAL_CONFIG) {
    logger.debug("Merging with previous config");
    config.addConfig(globalThis.GLOBAL_CONFIG);
  }

  if (!seed && files) {
    logger.debug({ files }, "Adding files");
    files.forEach((file) => config.addFile(file));
  }

  // load environment variable
  if (!seed && envVarName) {
    const envConfigText = _environmentVariables[envVarName];
    if (envConfigText) {
      logger.debug({ envVarName }, "Adding env var");
      config.addString(envConfigText);
    }
  }

  if (!seed && commandLineSwitch) {
    const args = _commandLineArgs.slice(2);
    while (args.length) {
      const arg = args.shift();
      if (arg === commandLineSwitch) {
        const filename = args.shift();
        logger.debug({ filename }, "Adding command line file");
        config.addFile(filename);
      }
    }
  }

  const configData = config.toJSON();

  // set timezone as early as possible
  if (configData.timezone) {
    _environmentVariables.TZ = configData.timezone;
  }

  globalThis.GLOBAL_CONFIG = configData;
};

export const getConfig = (path, defaultIfUndefined) => {
  if (!globalThis.GLOBAL_CONFIG) throw new Error("Config not loaded");
  if (!path) return globalThis.GLOBAL_CONFIG;
  const value = path
    .split(".")
    .reduce((obj, part) => obj?.[part], globalThis.GLOBAL_CONFIG);
  return value === undefined ? defaultIfUndefined : value;
};
