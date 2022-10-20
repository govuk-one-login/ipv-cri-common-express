const { handler } = require("./handler");
const { replaceTranslate } = require("./replace-translate");

const setI18n = ({ router, config: { cookieDomain, debug, secure } }) => {
  router.use(handler({ cookieDomain, debug, secure }));
  router.use(replaceTranslate);
};

module.exports = {
  setI18n: setI18n,
};
