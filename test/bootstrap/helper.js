import { vi } from "vitest";
import { setupConfig } from "../../src/bootstrap/lib/config.js";
import { resolve } from "node:path";
import * as loggerModule from "../../src/bootstrap/lib/logger.js";

global.APP_ROOT = resolve(__dirname, "..", "..");

global.CONFIG_RESET = () => {
  setupConfig({
    APP_ROOT: resolve(__dirname, "fixtures"),
    seed: {
      APP_NAME: "test",
      APP_VERSION: "1.0.1",
      featureFlags: { testFeature: true },
    },
  });
};

global.LOGGER_RESET = () => {
  const loggerStub = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  if (vi.isMockFunction(loggerModule.getLogger)) {
    loggerModule.getLogger.mockRestore();
  }
  vi.spyOn(loggerModule, "getLogger").mockReturnValue(loggerStub);

  return loggerStub;
};

global.CONFIG_RESET();
global.LOGGER_RESET();
