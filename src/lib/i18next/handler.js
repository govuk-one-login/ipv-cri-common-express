const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");

const { configure } = require("./configure");

const handler = ({ cookieDomain, debug, secure } = {}) => {
  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(configure({ cookieDomain, debug, secure }));

  return i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ["/public"], // or function(req, res, options, i18next) { /* return true to ignore */ }
  });
};

module.exports = {
  handler,
};
