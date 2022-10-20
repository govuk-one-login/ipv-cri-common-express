const defaultConfig = {
  // debug: false - set i18next with debug
  initImmediate: false,
  returnObjects: true,
  supportedLngs: ["en", "cy"],
  fallbackLng: ["en"],
  preload: ["en", "cy"],
  ns: ["default", "fields", "pages", "pages.errors"],
  nsSeparator: ".",
  returnEmptyString: true,
  defaultNS: "default",
  fallbackNS: ["fields", "pages", "pages.errors"],
  backend: {
    loadPath: "./src/locales/{{lng}}/{{ns}}.yml",
  },
  saveMissingTo: "current",
  detection: {
    lookupCookie: "lng",
    lookupQuerystring: "lng",
    order: ["querystring", "cookie"],
    caches: ["cookie"],
    ignoreCase: true,
    cookieSecure: true,
    // cookieDomain: "" - domain to use for i18next lang cookie
    cookieSameSite: "",
  },
};

module.exports = defaultConfig;
