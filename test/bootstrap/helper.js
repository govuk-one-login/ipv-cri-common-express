import { vi } from "vitest";

const resolve = require("path").resolve;

global.APP_ROOT = resolve(__dirname, "..", "..");

global.CONFIG_RESET = () => {
  delete global.GLOBAL_CONFIG;
  const config = require(APP_ROOT + "/src/bootstrap/lib/config");
  config.setup({
    APP_ROOT: resolve(__dirname, "fixtures"),
    seed: {
      APP_NAME: "test",
      APP_VERSION: "1.0.1",
      featureFlags: { testFeature: true },
      logs: { console: true },
    },
  });
};

global.LOGGER_RESET = () => {
  const loggerStub = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  const logger = require(APP_ROOT + "/src/bootstrap/lib/logger");
  if (vi.isMockFunction(logger.get)) {
    logger.get.mockRestore();
  }
  vi.spyOn(logger, "get").mockReturnValue(loggerStub);

  return loggerStub;
};

CONFIG_RESET();
LOGGER_RESET();
