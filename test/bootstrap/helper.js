import { vi } from "vitest";
import { setupConfig } from "../../src/bootstrap/lib/config.js";
import { resolve } from "node:path";
import * as loggerModule from "../../src/lib/logger.js";
import { PACKAGE_NAME } from "../../src/lib/constants.js";

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
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  };

  if (vi.isMockFunction(loggerModule.getLogger)) {
    loggerModule.getLogger.mockRestore();
  }
  const packageLogger = loggerModule.getLogger(PACKAGE_NAME);
  for (const level of Object.keys(loggerStub)) {
    vi.spyOn(packageLogger, level).mockImplementation(loggerStub[level]);
  }
  vi.spyOn(loggerModule, "getLogger").mockReturnValue(loggerStub);

  return loggerStub;
};

global.CONFIG_RESET();
global.LOGGER_RESET();
