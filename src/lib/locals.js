module.exports = {
  getGTM: function (req, res, next) {
    res.locals.gtmId = req.app.get("APP.GTM.ID");
    res.locals.scriptNonce = req.app.get("APP.GTM.SCRIPT_NONCE");
    res.locals.analyticsCookieDomain = req.app.get(
      "APP.GTM.ANALYTICS_COOKIE_DOMAIN"
    );
    next();
  },
};
