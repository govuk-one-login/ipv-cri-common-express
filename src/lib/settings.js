module.exports = {
  setGTM: ({ app, id, analyticsCookieDomain }) => {
    app.set("APP.GTM.ID", id);
    app.set("APP.GTM.ANALYTICS_COOKIE_DOMAIN", analyticsCookieDomain);
  },
};
