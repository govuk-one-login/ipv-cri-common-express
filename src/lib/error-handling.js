const oAuth = require("./oauth");
const logger = require("../bootstrap/lib/logger");

const DEFAULT_ERROR_CODE = "server_error";
const DEFAULT_ERROR_DESCRIPTION = "general error";

module.exports = {
  redirectAsErrorToCallback: async (err, req, res, next) => {
    let error = {
      code: DEFAULT_ERROR_CODE,
      description: DEFAULT_ERROR_DESCRIPTION,
    };

    let redirect_uri = req.session?.authParams?.redirect_uri;

    if (err.isAxiosError) {
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
      const redirectUrl = oAuth.buildRedirectUrl({
        authParams: {
          error,
          redirect_uri,
        },
      });

      logger.get().info("Redirecting to callback", {
        oauthErrorPresent: !!err?.response?.data?.oauth_error,
        statusCode: err?.response?.status,
        hasRedirectUri: !!redirect_uri,
      });

      return res.redirect(redirectUrl.toString());
    } catch (e) {
      return next(err);
    }
  },
};
