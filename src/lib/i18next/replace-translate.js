const replaceTranslate = (req, res, next) => {
  req.translate = req.i18n.getFixedT(req.i18n.language);
  next();
};

module.exports = {
  replaceTranslate,
};
