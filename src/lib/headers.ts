import type { Request, Response, NextFunction } from "express";

export default (req: Request, res: Response, next: NextFunction) => {
  req.headers["x-forwarded-proto"] = "https";
  next();
};
