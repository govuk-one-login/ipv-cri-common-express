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
    app.set("APP.GTM.GA4_CONTAINER_ID", ga4ContainerId);
    app.set("APP.GTM.ANALYTICS_COOKIE_DOMAIN", analyticsCookieDomain);
    app.set("APP.GTM.UA_CONTAINER_ID", uaContainerId);
    app.set("APP.GTM.GA4_ENABLED", ga4Enabled);
    app.set("APP.GTM.UA_ENABLED", uaEnabled);
    app.set("APP.GTM.GA4_PAGE_VIEW_ENABLED", ga4PageViewEnabled ?? true);
    app.set(
      "APP.GTM.GA4_FORM_RESPONSE_ENABLED",
      ga4FormResponseEnabled ?? true,
    );
    app.set("APP.GTM.GA4_FORM_ERROR_ENABLED", ga4FormErrorEnabled ?? true);
    app.set("APP.GTM.GA4_FORM_CHANGE_ENABLED", ga4FormChangeEnabled ?? true);
    app.set("APP.GTM.GA4_NAVIGATION_ENABLED", ga4NavigationEnabled ?? true);
    app.set(
      "APP.GTM.GA4_SELECT_CONTENT_ENABLED",
      ga4SelectContentEnabled ?? true,
    );
    app.set("APP.GTM.ANALYTICS_DATA_SENSITIVE", analyticsDataSensitive ?? true);
  },

  setLanguageToggle: ({ app, showLanguageToggle }) => {
    app.set("APP.LANGUAGE_TOGGLE_ENABLED", showLanguageToggle);
  },
};
