import { settings } from "@govuk-one-login/frontend-ui";

export const setGTM = ({
  app,
  ga4ContainerId,
  analyticsCookieDomain,
  ga4Enabled,
  ga4PageViewEnabled,
  ga4FormResponseEnabled,
  ga4FormErrorEnabled,
  ga4FormChangeEnabled,
  ga4NavigationEnabled,
  ga4SelectContentEnabled,
  analyticsDataSensitive,
}) => {
  settings.setGTM({
    app,
    ga4ContainerId,
    analyticsCookieDomain,
    ga4Enabled,
    ga4PageViewEnabled,
    ga4FormResponseEnabled,
    ga4FormErrorEnabled,
    ga4FormChangeEnabled,
    ga4NavigationEnabled,
    ga4SelectContentEnabled,
    analyticsDataSensitive,
  });

  // Backward-compat: UA settings not supported by frontend-ui but still
  // consumed by existing templates/middleware in downstream CRIs.
  app.set("APP.GTM.UA_CONTAINER_ID", undefined);
  app.set("APP.GTM.UA_ENABLED", false);
};

export const setLanguageToggle = ({ app, showLanguageToggle }) => {
  // Coerce legacy "1"/"0" string values to boolean before delegating.
  const enabled = showLanguageToggle === "1" || showLanguageToggle === true;

  settings.setLanguageToggle({ app, showLanguageToggle: enabled });
};

export const setDeviceIntelligence = ({
  app,
  deviceIntelligenceEnabled,
  deviceIntelligenceDomain,
}) => {
  // Coerce legacy "true"/"false" string values to boolean before delegating.
  const enabled =
    deviceIntelligenceEnabled === "true" || deviceIntelligenceEnabled === true;

  settings.setDeviceIntelligence({
    app,
    deviceIntelligenceEnabled: enabled,
    deviceIntelligenceDomain,
  });
};
