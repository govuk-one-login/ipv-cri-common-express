const oAuth = require("./oauth");
const { PACKAGE_NAME } = require("./constants");
const { CustomFetchHttpError } = require("./custom-fetch");
const logger = require("../bootstrap/lib/logger").get(PACKAGE_NAME);

const DEFAULT_ERROR_CODE = "server_error";
const DEFAULT_ERROR_DESCRIPTION = "general error";

async function handleHttpError(httpError) {
  let responseObject;
  if (httpError.body) {
    try {
      responseObject = JSON.parse(httpError.body);
    } catch {
      logger.warn("Unable to parse HTTP response body as JSON");
    }
  }

  const errorCode = responseObject?.oauth_error?.error ?? responseObject?.code;
  const errorDescription =
    responseObject?.oauth_error?.error_description ?? responseObject?.message;
  const redirectUri = responseObject?.redirect_uri;

  return {
    code: errorCode,
    description: errorDescription,
    redirect_uri: redirectUri,
  };
}

async function resolveErrorOutput(err) {
  const outputData = {
    code: DEFAULT_ERROR_CODE,
    description: DEFAULT_ERROR_DESCRIPTION,
  };
  let redirect_uri;

  if (err instanceof CustomFetchHttpError) {
    const httpData = await handleHttpError(err);

    if (httpData.code) outputData.code = httpData.code;
    if (httpData.description) outputData.description = httpData.description;
    if (httpData.redirect_uri) redirect_uri = httpData.redirect_uri;
  }

  return { outputData, redirect_uri };
}

module.exports = {
  redirectAsErrorToCallback: async (err, req, res, next) => {
    if (err.code === "MISSING_SESSION_DATA" && err.status === 401) {
      return next(err);
    }

    const assetPath = req.app?.locals?.assetPath || "/public";

    if (req.path?.startsWith(assetPath)) {
      return next(err);
    }

    logger.error("Handling error in redirectAsErrorToCallback", {
      errorName: err?.name,
      errorCode: err?.code,
      errorStatus: err?.status,
      path: req.path,
    });

    const { outputData, redirect_uri: httpRedirectUri } =
      await resolveErrorOutput(err);

    const redirect_uri =
      httpRedirectUri || req.session?.authParams?.redirect_uri;

    if (redirect_uri) {
      try {
        const redirectUrl = oAuth.buildRedirectUrl({
          authParams: {
            error: outputData,
            redirect_uri,
          },
        });

        logger.info("Redirecting to callback with error", outputData);

        return res.redirect(redirectUrl.toString());
      } catch {
        return next(err);
      }
    } else if (!req.session?.tokenId && !req.session?.authParams?.state) {
      err.code = "MISSING_AUTHPARAMS";
      return next(err);
    } else {
      return next(new Error("Missing redirect_uri"));
    }
  },
};
