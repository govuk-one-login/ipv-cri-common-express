const i18next = require("i18next");
const { handler } = require("./handler");
const { replaceTranslate } = require("./replace-translate");

const setI18n = ({
  router,
  config: { cookieDomain, debug, secure, additionalNamespaces },
  onInit,
}) => {
  router.use(
    handler({ cookieDomain, debug, secure, additionalNamespaces, onInit }),
  );
  router.use(replaceTranslate);
};

module.exports = {
  setI18n,
  i18next,
};
