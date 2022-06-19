const { generateNonce } = require("./strings");

module.exports = {
  setGTM: ({ app, id, cspNonce, analyticsCookieDomain }) => {
    app.set("APP.GTM.ID", id);
    app.set("APP.CSP_NONCE", cspNonce || generateNonce());
    app.set("APP.GTM.ANALYTICS_COOKIE_DOMAIN", analyticsCookieDomain);
  },
};
