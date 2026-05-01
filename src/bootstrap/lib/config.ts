import createDebug from "debug";
import HmpoConfig from "hmpo-config";

const debug = createDebug("hmpo-app:config");

declare global {
  var GLOBAL_CONFIG: Record<string, unknown> | undefined;
}

const defaultFiles = [
  "config/default.json",
  "config/default.yaml",
  "config/default.yml",
];

interface SetupOptions {
  APP_ROOT?: string;
  seed?: unknown;
  files?: string[];
  envVarName?: string;
  commandLineSwitch?: string;
  merge?: boolean;
  _commandLineArgs?: string[];
  _environmentVariables?: NodeJS.ProcessEnv;
}

const setup = ({
  APP_ROOT,
  seed,
  files = defaultFiles,
  envVarName = "HMPO_CONFIG",
  commandLineSwitch = "-c",
  merge = true,
  _commandLineArgs = process.argv,
  _environmentVariables = process.env,
}: SetupOptions = {}): void => {
  const config = new HmpoConfig(APP_ROOT);

  if (seed) {
    debug("Merging with previous config");
    config.addConfig(seed);
  }

  if (!seed && merge && global.GLOBAL_CONFIG) {
    debug("Merging with previous config");
    config.addConfig(global.GLOBAL_CONFIG);
  }

  if (!seed && files) {
    debug("Adding files", files);
    files.forEach((file) => config.addFile(file));
  }

  if (!seed && envVarName) {
    const envConfigText = _environmentVariables[envVarName];
    if (envConfigText) {
      debug("Adding env var", envVarName);
      config.addString(envConfigText);
    }
  }

  if (!seed && commandLineSwitch) {
    const args = _commandLineArgs.slice(2);
    while (args.length) {
      const arg = args.shift();
      if (arg === commandLineSwitch) {
        const filename = args.shift();
        debug("Adding command line file", filename);
        config.addFile(filename);
      }
    }
  }

  const configData = config.toJSON();

  if (configData.timezone) {
    _environmentVariables.TZ = configData.timezone as string;
  }

  global.GLOBAL_CONFIG = configData;
};

const get = <T = unknown>(path?: string, defaultIfUndefined?: unknown): T => {
  if (!global.GLOBAL_CONFIG) throw new Error("Config not loaded");
  if (!path) return global.GLOBAL_CONFIG as T;
  const value = path
    .split(".")
    .reduce<unknown>(
      (obj, part) => (obj as Record<string, unknown>)?.[part],
      global.GLOBAL_CONFIG,
    );
  return (value === undefined ? defaultIfUndefined : value) as T;
};

export { defaultFiles, setup, get };
