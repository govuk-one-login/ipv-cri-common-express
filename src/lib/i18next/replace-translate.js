const replaceTranslate = (req, res, next) => {
  const t = req.i18n.getFixedT(req.i18n.language);
  req.translate = t;
  if (typeof res.locals.translate !== "function") {
    res.locals.translate = (key, opts) => t(key, { ...res.locals, ...opts });
  }
  next();
};

module.exports = {
  replaceTranslate,
};
