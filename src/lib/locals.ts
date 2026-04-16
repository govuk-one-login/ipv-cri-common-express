import type { Request, Response, NextFunction } from "express";

import constants from "./constants";
import * as logger from "../bootstrap/lib/logger";

const getGTM = (req: Request, res: Response, next: NextFunction) => {
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
  res.locals.ga4PageViewEnabled = req.app.get("APP.GTM.GA4_PAGE_VIEW_ENABLED");
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
};

const getAssetPath = (req: Request, res: Response, next: NextFunction) => {
  res.locals.assetPath = req.app.get("APP.ASSET_PATH");
  next();
};

const getLanguageToggle = (req: Request, res: Response, next: NextFunction) => {
  const toggleValue = req.app.get("APP.LANGUAGE_TOGGLE_ENABLED");
  res.locals.showLanguageToggle = toggleValue && toggleValue === "1";
  res.locals.htmlLang = req.i18n.language;
  try {
    res.locals.currentUrl = new URL(
      req.protocol + "://" + req.get("host") + req.originalUrl,
    );
  } catch (e) {
    logger
      .get(constants.PACKAGE_NAME)
      .error("Error constructing url for language toggle", (e as Error).message);
  }
  next();
};

const getDeviceIntelligence = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const toggleValue = req.app.get("APP.DEVICE_INTELLIGENCE_ENABLED");
  res.locals.deviceIntelligenceEnabled = toggleValue && toggleValue === "true";
  res.locals.deviceIntelligenceDomain = req.app.get(
    "APP.DEVICE_INTELLIGENCE_DOMAIN",
  );
  next();
};

export { getGTM, getAssetPath, getLanguageToggle, getDeviceIntelligence };
