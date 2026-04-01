import type { Request, Response, NextFunction } from "express";

import * as oauth from "./oauth.js";
import constants from "./constants.js";
import * as logger from "../bootstrap/lib/logger.js";
import axios, { type AxiosError } from "axios";

const DEFAULT_ERROR_CODE = "server_error";
const DEFAULT_ERROR_DESCRIPTION = "general error";

module.exports = {
  redirectAsErrorToCallback: async (
    err: AxiosError | { code?: string; status?: number },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    let error = {
      code: DEFAULT_ERROR_CODE,
      description: DEFAULT_ERROR_DESCRIPTION,
    };

    let redirect_uri = req.session?.authParams?.redirect_uri;

    if (axios.isAxiosError(err)) {
      const errorResponse = err?.response?.data;

      error.code =
        errorResponse?.oauth_error?.error || errorResponse?.code || error.code;
      error.description =
        errorResponse?.oauth_error?.error_description ||
        errorResponse?.message ||
        error.description;

      redirect_uri = err?.response?.data?.redirect_uri || redirect_uri;
    }

    if (err.code === "MISSING_SESSION_DATA" && err.status === 401) {
      return next(err);
    }

    if (
      !redirect_uri &&
      !req.session?.tokenId &&
      !req.session?.authParams?.state
    ) {
      err.code = "MISSING_AUTHPARAMS";
      return next(err);
    }

    if (!redirect_uri) {
      return next(new Error("Missing redirect_uri"));
    }

    try {
      const redirectUrl = oauth.buildRedirectUrl({
        authParams: {
          error,
          redirect_uri,
        },
      });

      logger
        .get(constants.PACKAGE_NAME)
        .info("Redirecting to callback with error", error);

      return res.redirect(redirectUrl.toString());
    } catch {
      return next(err);
    }
  },
};
