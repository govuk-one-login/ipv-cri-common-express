const express = require("express");
const reqres = require("reqres");
const { setGTM } = require("../../src/lib/settings");
const { getGTM } = require("../../src/lib/locals");

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
      res.locals.should.eql({
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
