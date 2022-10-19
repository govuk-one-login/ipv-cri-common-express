const { handler } = require("./handler");
const { replaceTranslate } = require("./replace-translate");

const setI18n = ({ router, config }) => {
  router.use(handler(config));
  router.use(replaceTranslate);
};

module.exports = {
  setI18n: setI18n,
};
