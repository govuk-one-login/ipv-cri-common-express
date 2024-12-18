const { PACKAGE_NAME } = require("../lib/constants");
const logger = require("hmpo-logger").get(PACKAGE_NAME);

module.exports = {
  getGTM: function (req, res, next) {
    res.locals.ga4ContainerId = req.app.get("APP.GTM.GA4_CONTAINER_ID");
    res.locals.uaContainerId = req.app.get("APP.GTM.UA_CONTAINER_ID");
    res.locals.analyticsCookieDomain = req.app.get(
      "APP.GTM.ANALYTICS_COOKIE_DOMAIN",
    );
    res.locals.ga4Enabled = req.app.get("APP.GTM.GA4_ENABLED");
    res.locals.uaEnabled = req.app.get("APP.GTM.UA_ENABLED");
    res.locals.analyticsDataSensitive = req.app.get(
      "APP.GTM.ANALYTICS_DATA_SENSITIVE",
    );
    res.locals.ga4PageViewEnabled = req.app.get(
      "APP.GTM.GA4_PAGE_VIEW_ENABLED",
    );
    res.locals.ga4FormResponseEnabled = req.app.get(
      "APP.GTM.GA4_FORM_RESPONSE_ENABLED",
    );
    res.locals.ga4FormErrorEnabled = req.app.get(
      "APP.GTM.GA4_FORM_ERROR_ENABLED",
    );
    res.locals.ga4FormChangeEnabled = req.app.get(
      "APP.GTM.GA4_FORM_CHANGE_ENABLED",
    );
    res.locals.ga4NavigationEnabled = req.app.get(
      "APP.GTM.GA4_NAVIGATION_ENABLED",
    );
    res.locals.ga4SelectContentEnabled = req.app.get(
      "APP.GTM.GA4_SELECT_CONTENT_ENABLED",
    );
    next();
  },

  getAssetPath: function (req, res, next) {
    res.locals.assetPath = req.app.get("APP.ASSET_PATH");
    next();
  },
  getLanguageToggle: function (req, res, next) {
    const toggleValue = req.app.get("APP.LANGUAGE_TOGGLE_ENABLED");
    res.locals.showLanguageToggle = toggleValue && toggleValue === "1";
    res.locals.htmlLang = req.i18n.language;
    try {
      res.locals.currentUrl = new URL(
        req.protocol + "://" + req.get("host") + req.originalUrl,
      );
    } catch (e) {
      logger.error("Error constructing url for language toggle", e.message);
    }
    next();
  },
};
