import type {Request, Response, NextFunction} from 'express'

export default (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    req.scenarioIDHeader = req.headers["x-scenario-id"] as string;
  }

  next();
};
