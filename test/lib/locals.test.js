import { expect, beforeEach, afterEach, describe, it, vi } from "vitest";
import express from "express";
import reqres from "hmpo-reqres";

import {
  setGTM,
  setDeviceIntelligence,
  setLanguageToggle,
} from "../../src/lib/settings";
import {
  getGTM,
  getDeviceIntelligence,
  getLanguageToggle,
} from "../../src/lib/locals";
import { PACKAGE_NAME } from "../../src/lib/constants.js";
import { getLogger } from "../../src/bootstrap/lib/logger.js";

const logger = getLogger(PACKAGE_NAME);

describe("setGTM / getGTM", () => {
  it("Sets express config and retrieves it", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getGTM);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setGTM({
      app,
      ga4ContainerId: "ga4ContainerIdTest",
      analyticsCookieDomain: "analyticsCookieDomainTest",
      ga4Enabled: "ga4EnabledTest",
      ga4PageViewEnabled: "ga4PageViewEnabledTest",
      ga4FormResponseEnabled: "ga4FormResponseEnabledTest",
      ga4FormErrorEnabled: "ga4FormErrorEnabledTest",
      ga4FormChangeEnabled: "ga4FormChangeEnabledTest",
      ga4NavigationEnabled: "ga4NavigationEnabledTest",
      ga4SelectContentEnabled: "ga4SelectContentEnabledTest",
      analyticsDataSensitive: "analyticsDataSensitiveTest",
    });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals).toEqual({
        ga4ContainerId: "ga4ContainerIdTest",
        analyticsCookieDomain: "analyticsCookieDomainTest",
        ga4Enabled: "ga4EnabledTest",
        uaContainerId: undefined,
        uaEnabled: false,
        ga4PageViewEnabled: "ga4PageViewEnabledTest",
        ga4FormResponseEnabled: "ga4FormResponseEnabledTest",
        ga4FormErrorEnabled: "ga4FormErrorEnabledTest",
        ga4FormChangeEnabled: "ga4FormChangeEnabledTest",
        ga4NavigationEnabled: "ga4NavigationEnabledTest",
        ga4SelectContentEnabled: "ga4SelectContentEnabledTest",
        analyticsDataSensitive: "analyticsDataSensitiveTest",
      });
    });
  });
});

describe("setDeviceIntelligence / getDeviceIntelligence", () => {
  it("Sets express config with string 'true' toggle and retrieves it", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getDeviceIntelligence);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setDeviceIntelligence({
      app,
      deviceIntelligenceEnabled: "true",
      deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
    });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals).toEqual({
        deviceIntelligenceEnabled: true,
        deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
      });
    });
  });

  it("Sets express config with boolean true toggle and retrieves it", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getDeviceIntelligence);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setDeviceIntelligence({
      app,
      deviceIntelligenceEnabled: true,
      deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
    });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals).toEqual({
        deviceIntelligenceEnabled: true,
        deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
      });
    });
  });

  it("Sets express config with false toggle and retrieves it as false", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getDeviceIntelligence);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setDeviceIntelligence({
      app,
      deviceIntelligenceEnabled: "false",
      deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
    });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals).toEqual({
        deviceIntelligenceEnabled: false,
        deviceIntelligenceDomain: "deviceIntelligenceDomainTest",
      });
    });
  });
});

describe("setLanguageToggle / getLanguageToggle", () => {
  it("coerces string '1' to enabled and retrieves showLanguageToggle as true", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getLanguageToggle);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setLanguageToggle({ app, showLanguageToggle: "1" });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    req.protocol = "https";
    req.i18n = { language: "en" };
    req.originalUrl = "/test-path";
    req.get = (header) => {
      if (header === "host") return "example.com";
    };
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals.showLanguageToggle).toBe(true);
      expect(res.locals.htmlLang).toBe("en");
    });
  });

  it("coerces boolean true to enabled and retrieves showLanguageToggle as true", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getLanguageToggle);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setLanguageToggle({ app, showLanguageToggle: true });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    req.protocol = "https";
    req.i18n = { language: "cy" };
    req.originalUrl = "/test";
    req.get = (header) => {
      if (header === "host") return "example.com";
    };
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals.showLanguageToggle).toBe(true);
      expect(res.locals.htmlLang).toBe("cy");
    });
  });

  it("coerces string '0' to disabled and retrieves showLanguageToggle as false", () => {
    const TEST_ROUTE = "/test";
    const app = express();
    const router = express.Router();
    router.use(getLanguageToggle);
    router.route(TEST_ROUTE).get((req, res, next) => {
      next();
    });
    setLanguageToggle({ app, showLanguageToggle: "0" });
    const req = reqres.req({ url: TEST_ROUTE });
    req.app = app;
    req.protocol = "https";
    req.i18n = { language: "en" };
    req.originalUrl = "/test";
    req.get = (header) => {
      if (header === "host") return "example.com";
    };
    const res = reqres.res();
    router(req, res, () => {
      expect(res.locals.showLanguageToggle).toBe(false);
    });
  });
});

describe("getLanguageToggle middleware", () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    req = {
      app: {
        get: vi.fn(),
      },
      protocol: "https",
      get: vi.fn().mockImplementation((args) => {
        if (args === "host") return "example.com";
      }), // Default behavior for host,
      originalUrl: "/test-path",
      i18n: {
        language: "en",
      },
    };

    res = {
      locals: {},
    };

    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocked methods
  });

  it("should log an error if constructing currentUrl fails", () => {
    req.get.mockImplementation(() => {
      throw new Error("Invalid host");
    });

    getLanguageToggle(req, res, next);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Error constructing url for language toggle",
      "Invalid host",
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set res.locals.currentUrl to the correct value", () => {
    getLanguageToggle(req, res, next);

    expect(res.locals.currentUrl).toBeInstanceOf(URL); // Check type
    expect(res.locals.currentUrl.href).toEqual("https://example.com/test-path");

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set showLanguageToggle to true when toggle value is true", () => {
    req.app.get.mockImplementation((key) => {
      if (key === "APP.LANGUAGE_TOGGLE_ENABLED") return true;
    });

    getLanguageToggle(req, res, next);

    expect(res.locals.showLanguageToggle).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set showLanguageToggle to false when toggle value is false", () => {
    req.app.get.mockImplementation((key) => {
      if (key === "APP.LANGUAGE_TOGGLE_ENABLED") return false;
    });

    getLanguageToggle(req, res, next);

    expect(res.locals.showLanguageToggle).toBe(false);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
