import helmetLib, { frameguard } from "helmet";
import compression from "compression";
import { randomBytes } from "node:crypto";
import { noCacheMiddleware } from "./nocache";
import { browserCompatibilityMiddleware } from "./compatibility";

export const setupHeaders = (
  app,
  {
    disableCompression = false,
    trustProxy = true,
    publicPath = "/public",
    helmet,
  } = {},
) => {
  // Security
  if (helmet) {
    app.use((_req, res, next) => {
      randomBytes(16, (err, randomBytes) => {
        if (err) {
          next(err);
        } else {
          res.locals.cspNonce = randomBytes.toString("hex");
          next();
        }
      });
    });

    app.use(helmetLib(helmet));
  } else {
    app.disable("x-powered-by");
    app.use(frameguard("sameorigin"));
  }

  // Headers
  app.set("trust proxy", trustProxy);
  app.use(noCacheMiddleware({ publicPath }));
  app.use(browserCompatibilityMiddleware());
  if (!disableCompression) app.use(compression());
};
