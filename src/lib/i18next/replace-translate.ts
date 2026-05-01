import type { Request, Response, NextFunction } from "express";

const replaceTranslate = (req: Request, res: Response, next: NextFunction) => {
  req.translate = req.i18n.getFixedT(req.i18n.language);
  next();
};

export {
  replaceTranslate,
}
