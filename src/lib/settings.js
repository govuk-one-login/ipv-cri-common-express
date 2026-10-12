const { settings } = require("@govuk-one-login/frontend-ui");

module.exports = {
  setGTM: ({
    app,
    ga4ContainerId,
    uaContainerId,
    analyticsCookieDomain,
    ga4Enabled,
    uaEnabled,
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
    app.set("APP.GTM.UA_CONTAINER_ID", uaContainerId);
    app.set("APP.GTM.UA_ENABLED", uaEnabled);
  },

  setLanguageToggle: ({ app, showLanguageToggle }) => {
    // Coerce legacy "1"/"0" string values to boolean before delegating.
    const enabled = showLanguageToggle === "1" || showLanguageToggle === true;

    settings.setLanguageToggle({ app, showLanguageToggle: enabled });
  },

  setDeviceIntelligence: ({
    app,
    deviceIntelligenceEnabled,
    deviceIntelligenceDomain,
  }) => {
    // Coerce legacy "true"/"false" string values to boolean before delegating.
    const enabled =
      deviceIntelligenceEnabled === "true" ||
      deviceIntelligenceEnabled === true;

    settings.setDeviceIntelligence({
      app,
      deviceIntelligenceEnabled: enabled,
      deviceIntelligenceDomain,
    });
  },
};
