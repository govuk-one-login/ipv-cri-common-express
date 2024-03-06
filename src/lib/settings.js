module.exports = {
  setGTM: ({
    app,
    ga4ContainerId,
    uaContainerId,
    analyticsCookieDomain,
    ga4Disabled,
    uaDisabled,
  }) => {
    app.set("APP.GTM.GA4_CONTAINER_ID", ga4ContainerId);
    app.set("APP.GTM.ANALYTICS_COOKIE_DOMAIN", analyticsCookieDomain);
    app.set("APP.GTM.UA_CONTAINER_ID", uaContainerId);
    app.set("APP.GTM.GA4_DISABLED", ga4Disabled);
    app.set("APP.GTM.UA_DISABLED", uaDisabled);
  },

  setLanguageToggle: ({ app, showLanguageToggle, htmlLang }) => {
    app.set("APP.LANGUAGE_TOGGLE_ENABLED", showLanguageToggle);
    app.set("APP.HTML_LANG", htmlLang);
  },
};
