import { PACKAGE_NAME } from "../constants";
import { getLogger } from "../../bootstrap/lib/logger.js";

let divergenceWarningLogged = false;

export const replaceTranslate = (req, res, next) => {
  const t = req.i18n.getFixedT(req.i18n.language);
  req.translate = t;
  // don't overwrite an existing res.locals.translate (e.g. hmpo-components' locals
  // middleware wraps t with recursiveRender for nunjucks placeholders in values).
  if (typeof res.locals.translate !== "function") {
    res.locals.translate = (key, opts) => t(key, { ...res.locals, ...opts });
  } else if (!divergenceWarningLogged) {
    divergenceWarningLogged = true;
    getLogger(PACKAGE_NAME).warn(
      "existing function already present on 'res.locals.translate'. 'req.translate' is i18next getFixedT, 'res.locals.translate' is whatever an earlier middleware installed (probably hmpo-components recursiveRender wrapper)",
    );
  }
  next();
};
