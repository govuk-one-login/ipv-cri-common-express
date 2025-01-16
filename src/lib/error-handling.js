const oAuth = require("./oauth");
const { PACKAGE_NAME } = require("./constants");
const logger = require("hmpo-logger").get(PACKAGE_NAME);

const DEFAULT_ERROR_CODE = "server_error";
const DEFAULT_ERROR_DESCRIPTION = "general error";

module.exports = {
  redirectAsErrorToCallback: async (err, req, res, next) => {
    logger.debug("Error handling entered", err);

    let error = {
      code: DEFAULT_ERROR_CODE,
      description: DEFAULT_ERROR_DESCRIPTION,
    };

    let redirect_uri = req.session?.authParams?.redirect_uri;

    if (err.isAxiosError) {
      logger.debug("isAxiosError", err.isAxiosError);

      const errorResponse = err?.response?.data;

      error.code =
        errorResponse?.oauth_error?.error || errorResponse?.code || error.code;
      error.description =
        errorResponse?.oauth_error?.error_description ||
        errorResponse?.message ||
        error.description;

      redirect_uri = err?.response?.data?.redirect_uri || redirect_uri;
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

      logger.debug("Redirecting to callback with error", error);

      return res.redirect(redirectUrl.toString());
    } catch (e) {
      return next(err);
    }
  },
};
