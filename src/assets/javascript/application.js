
(function (w) {
  "use strict";
  function appInit(trackingId, analyticsCookieDomain, journey, status) {

    w.GOVUKFrontend.initAll();

    var cookies = w.GOVSignIn.Cookies(trackingId, analyticsCookieDomain, journey, status);

    if (cookies.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }

    cookies.cookieBannerInit();
  }

  w.GOVSignIn.appInit = appInit;
})(window);
