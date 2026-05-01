import type { NextFunction, Request, Response } from 'express'

const middleware = () => (_: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-UA-Compatible", "IE=edge,chrome=1");
  next();
};

export {
  middleware
}
