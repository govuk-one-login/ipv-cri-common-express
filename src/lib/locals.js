module.exports = {
  getGTM: function (req, res, next) {
    res.locals.ga4ContainerId = req.app.get("APP.GTM.GA4_CONTAINER_ID");
    res.locals.uaContainerId = req.app.get("APP.GTM.UA_CONTAINER_ID");
    res.locals.analyticsCookieDomain = req.app.get(
      "APP.GTM.ANALYTICS_COOKIE_DOMAIN",
    );
    res.locals.ga4Disabled = req.app.get("APP.GTM.GA4_DISABLED");
    res.locals.uaDisabled = req.app.get("APP.GTM.UA_DISABLED");
    next();
  },

  getAssetPath: function (req, res, next) {
    res.locals.assetPath = req.app.get("APP.ASSET_PATH");
    next();
  },
  getLanguageToggle: function (req, res, next) {
    res.locals.showLanguageToggle = req.app.get("APP.LANGUAGE_TOGGLE_ENABLED");
    next();
  },
};
