module.exports = {
  getGTM: function (req, res, next) {
    res.locals.gtmId = req.app.get("APP.GTM.ID");
    res.locals.analyticsCookieDomain = req.app.get(
      "APP.GTM.ANALYTICS_COOKIE_DOMAIN",
    );

    next();
  },

  getAssetPath: function (req, res, next) {
    res.locals.assetPath = req.app.get("APP.ASSET_PATH");

    next();
  },
};
