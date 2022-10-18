const { handler } = require("./handler");
const { replaceTranslate } = require("./replace-translate");

const setI18n = ({ app, config }) => {
  app.use(handler(config));
  app.use(replaceTranslate);
};

module.exports = {
  setI18n: setI18n,
};
