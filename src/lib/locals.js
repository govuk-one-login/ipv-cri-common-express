const { locals } = require("@govuk-one-login/frontend-ui");
const { PACKAGE_NAME } = require("../lib/constants");
const logger = require("../bootstrap/lib/logger").get(PACKAGE_NAME);

module.exports = {
  getGTM: function (req, res, next) {
    locals.getGTM(req, res, () => {
      // Backward-compat: UA locals not provided by frontend-ui but still
      // expected by existing templates/middleware in downstream CRIs.
      res.locals.uaContainerId = req.app.get("APP.GTM.UA_CONTAINER_ID");
      res.locals.uaEnabled = req.app.get("APP.GTM.UA_ENABLED");
      next();
    });
  },

  getAssetPath: function (req, res, next) {
    res.locals.assetPath = req.app.get("APP.ASSET_PATH");
    next();
  },

  getLanguageToggle: function (req, res, next) {
    const toggleValue = req.app.get("APP.LANGUAGE_TOGGLE_ENABLED");
    res.locals.showLanguageToggle = toggleValue && toggleValue === true;
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

  getDeviceIntelligence: function (req, res, next) {
    locals.getDeviceIntelligence(req, res, next);
  },
};
