import type { Request, Response, NextFunction } from "express";
// @ts-expect-error no types
import deepCloneMerge from "deep-clone-merge";

const middleware =
  ({
    sessionIDHeader = "X-SESSION-ID",
    scenarioIDHeader = "X-SCENARIO-ID",
    ...otherOptions
  } = {}) =>
  (req: Request, _: Response, next: NextFunction) => {
    req.modelOptions = (options: Record<string, unknown>) =>
      deepCloneMerge.extend(
        {
          headers: {
            [sessionIDHeader]: req.sessionID,
            [scenarioIDHeader]: req.session?.scenarioID,
          },
          logging: {
            req,
          },
        },
        otherOptions,
        options,
      );

    next();
  };

export { middleware };
