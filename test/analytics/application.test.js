const { expect } = require("chai");

describe("Init", () => {
  let events;

  beforeEach(async () => {
    events = [];
    global.window = {
      GOVUKFrontend: {
        initAll: () => "init",
      },
      GOVSignIn: {
        Cookies: () => {
          return {
            hasConsentForAnalytics: () => true,
            initAnalytics: () => events.push("init existing analytics"),
            cookieBannerInit: () => events.push("init existing cookie banner"),
          };
        },
      },
      DI: {
        cookieBannerInit: () => events.push("init new cookie banner"),
        loadAnalytics: () => events.push("init new analytics"),
      },
    };
    require("../../src/assets/javascript/application");
  });

  afterEach(() => {
    delete require.cache[
      require.resolve("../../src/assets/javascript/application")
    ];
  });

  describe("When GA4 is enabled", () => {
    const isGa4Enabled = "true";

    //analyticsCookieDomain, uaContainerId, isGa4Enabled, ga4ContainerId, gtmJourney
    it("Initialises cookie banner and loads analytics per new implementation", () => {
      global.window.DI.appInit(
        "domain",
        "uaContainerId",
        isGa4Enabled,
        "ga4ContainerId",
        "gtmJourney",
      );
      expect(events.length).to.equal(2);
      expect(events[0]).to.include("init new cookie banner");
      expect(events[1]).to.include("init new analytics");
    });
  });

  describe("When GA4 is not enabled", () => {
    const isGa4Enabled = "false";

    describe("When user has given consent to analytics cookies", () => {
      it("Initialises analytics and cookie banner per existing implementation", () => {
        global.window.DI.appInit(
          "domain",
          "uaContainerId",
          isGa4Enabled,
          "ga4ContainerId",
          "gtmJourney",
        );
        expect(events.length).to.equal(2);
        expect(events).to.include("init existing analytics");
        expect(events).to.include("init existing cookie banner");
      });
    });

    describe("When user has not given consent to analytics cookies", () => {
      it("Initialises cookie banner only per existing implementation", () => {
        global.window.GOVSignIn.Cookies = () => {
          return {
            hasConsentForAnalytics: () => false,
            initAnalytics: () => events.push("init existing analytics"),
            cookieBannerInit: () => events.push("init existing cookie banner"),
          };
        };

        global.window.DI.appInit({
          uaContainerId: "uaContainerId",
          domain: "domain",
          isGa4Enabled,
          gtmContainerId: "gtmContainerId",
        });
        expect(events.length).to.equal(1);
        expect(events).to.include("init existing cookie banner");
      });
    });
  });
});
