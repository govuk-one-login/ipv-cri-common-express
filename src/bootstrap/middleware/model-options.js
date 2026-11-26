import deepCloneMerge from "deep-clone-merge";

export const modelOptionsMiddleware =
  ({
    sessionIDHeader = "X-SESSION-ID",
    scenarioIDHeader = "X-SCENARIO-ID",
    ...otherOptions
  } = {}) =>
  (req, res, next) => {
    req.modelOptions = (options) =>
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
