import { locals } from "@govuk-one-login/frontend-ui";
import { PACKAGE_NAME } from "../lib/constants.js";
import { getLogger } from "../bootstrap/lib/logger.js";
const logger = getLogger(PACKAGE_NAME);

export function getGTM(req, res, next) {
  locals.getGTM(req, res, () => {
    // Backward-compat: UA locals not provided by frontend-ui but still
    // expected by existing templates/middleware in downstream CRIs.
    res.locals.uaContainerId = undefined;
    res.locals.uaEnabled = false;
    next();
  });
}

export function getAssetPath(req, res, next) {
  res.locals.assetPath = req.app.get("APP.ASSET_PATH");
  next();
}

export function getLanguageToggle(req, res, next) {
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
}

export function getDeviceIntelligence(req, res, next) {
  locals.getDeviceIntelligence(req, res, next);
}
