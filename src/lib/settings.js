module.exports = {
  setGTM: ({
    app,
    analyticsCookieDomain,
    uaContainerId,
    isGa4Enabled,
    ga4ContainerId,
    gaTaxonomyLevel2,
  }) => {
    app.set("APP.GTM.UA_CONTAINER_ID", uaContainerId);
    app.set("APP.GTM.ANALYTICS_COOKIE_DOMAIN", analyticsCookieDomain);
    app.set("APP.ANALYTICS.UA_CONTAINER_ID", uaContainerId);
    app.set("APP.ANALYTICS.GA4_ENABLED", isGa4Enabled);
    app.set("APP.ANALYTICS.GA4_CONTAINER_ID", ga4ContainerId);
    app.set("APP.ANALYTICS.GA_TAXONOMY_LEVEL_2", gaTaxonomyLevel2);
  },
};
