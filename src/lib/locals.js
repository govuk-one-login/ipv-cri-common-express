module.exports = {
  getGTM: function (req, res, next) {
    res.locals.analyticsCookieDomain = req.app.get(
      "APP.GTM.ANALYTICS_COOKIE_DOMAIN",
    );
    res.locals.uaContainerId = req.app.get("APP.ANALYTICS.UA_CONTAINER_ID");
    res.locals.isGa4Enabled = req.app.get("APP.ANALYTICS.GA4_ENABLED");
    res.locals.ga4ContainerId = req.app.get("APP.ANALYTICS.GA4_CONTAINER_ID");
    res.locals.gaTaxonomyLevel2 = req.app.get(
      "APP.ANALYTICS.GA_TAXONOMY_LEVEL_2",
    );

    next();
  },

  getAssetPath: function (req, res, next) {
    res.locals.assetPath = req.app.get("APP.ASSET_PATH");

    next();
  },
};
