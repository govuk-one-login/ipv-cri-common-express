import type { Request, Response, NextFunction, Express } from "express";
import helmetLib, { type HelmetOptions } from "helmet";
import * as nocache from "./nocache";
import * as compatibility from "./compatibility";
import compression from "compression";
import { randomBytes } from "crypto";

type SetupOptions = {
  disableCompression?: boolean;
  trustProxy?: boolean;
  publicPath?: string;
  helmetOptions?: HelmetOptions;
};

const setup = (
  app: Express,
  {
    disableCompression = false,
    trustProxy = true,
    publicPath = "/public",
    helmetOptions,
  }: SetupOptions = {},
) => {
  // Security
  if (helmetOptions) {
    app.use((_req: Request, res: Response, next: NextFunction) => {
      randomBytes(16, (err, randomBytes) => {
        if (err) {
          next(err);
        } else {
          res.locals.cspNonce = randomBytes.toString("hex");
          next();
        }
      });
    });

    app.use(helmetLib(helmetOptions));
  } else {
    app.disable("x-powered-by");
    app.use(
      helmetLib.frameguard({
        action: "sameorigin",
      }),
    );
  }

  // Headers
  app.set("trust proxy", trustProxy);
  app.use(nocache.middleware({ publicPath }));
  app.use(compatibility.middleware());
  if (!disableCompression) app.use(compression());
};

export {
  setup,
};
