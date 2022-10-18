const defaultConfig = {
  debug: true,
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
    order: ["querystring", "cookie"],
    caches: ["cookie"],
    cookieMinutes: 160,
    lookupQuerystring: "lng",
    lookupCookie: "lng",
  },
};

module.exports = defaultConfig;
