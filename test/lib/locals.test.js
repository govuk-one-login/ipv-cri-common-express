import { expect, beforeEach, afterEach, describe, it, vi } from "vitest";

const express = require("express");
const reqres = require("reqres");
const { setGTM, setDeviceIntelligence } = require("../../src/lib/settings");
const {
  getGTM,
  getDeviceIntelligence,
  getLanguageToggle,
} = require("../../src/lib/locals");
const { PACKAGE_NAME } = require("../../src/lib/constants");
const logger = require("../../src/bootstrap/lib/logger").get(PACKAGE_NAME);

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
      uaContainerId: "uaContainerIdTest",
      analyticsCookieDomain: "analyticsCookieDomainTest",
      ga4Enabled: "ga4EnabledTest",
      uaEnabled: "uaEnabledTest",
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
        uaContainerId: "uaContainerIdTest",
        analyticsCookieDomain: "analyticsCookieDomainTest",
        ga4Enabled: "ga4EnabledTest",
        uaEnabled: "uaEnabledTest",
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
  it("Sets express config with boolean toggle and retrieves it", () => {
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
});
