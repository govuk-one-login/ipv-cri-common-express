const { buildRedirectUrl } = require("../../lib/oauth");
const { PACKAGE_NAME } = require("../../lib/constants");
const {
  createPersonalDataHeaders,
} = require("@govuk-one-login/frontend-passthrough-headers");
const logger = require("../../bootstrap/lib/logger").get(PACKAGE_NAME);

module.exports = {
  addAuthParamsToSession: async (req, res, next) => {
    req.session.authParams = { client_id: req.query.client_id };

    next();
  },

  addJWTToRequest: (req, res, next) => {
    req.jwt = req.query?.request;
    next();
  },

  initSessionWithJWT: async (req, res, next) => {
    if (!req.jwt) {
      return next(new Error("Missing JWT"));
    }

    if (!req.session?.authParams?.client_id) {
      return next(new Error("Missing client_id"));
    }

    const sessionPath = req.app.get("API.PATHS.SESSION");
    if (!sessionPath) {
      return next(new Error("Missing API.PATHS.SESSION value"));
    }

    const requestJWT = req.jwt;
    try {
      if (requestJWT) {
        const headers = createPersonalDataHeaders(
          `${req.app.get("API.BASE_URL")}${req.app.get("API.PATHS.SESSION")}`,
          req,
        );

        const apiResponse = await req.axios.post(
          sessionPath,
          {
            request: req.jwt,
            client_id: req.session.authParams.client_id,
          },
          {
            headers,
          },
        );

        if (!apiResponse?.data["session_id"]) {
          logger.warn("No session ID in session response");
        }

        if (!apiResponse?.data?.redirect_uri) {
          logger.warn("No redirect URI in session response");
        }

        req.session.tokenId = apiResponse?.data["session_id"];
        req.session.authParams.state = apiResponse?.data?.state;
        req.session.authParams.redirect_uri = apiResponse?.data?.redirect_uri;
      }
      return next();
    } catch (error) {
      return next(error);
    }
  },

  retrieveAuthorizationCode: async (req, res, next) => {
    if (!req.session?.tokenId) {
      return next(new Error("Missing session-id"));
    }

    if (!req.session?.authParams?.client_id) {
      return next(new Error("Missing client_id"));
    }

    if (!req.session?.authParams?.state) {
      return next(new Error("Missing state"));
    }

    if (!req.session?.authParams?.redirect_uri) {
      return next(new Error("Missing redirect_uri"));
    }

    const authorizationPath = req.app.get("API.PATHS.AUTHORIZATION");
    if (!authorizationPath) {
      return next(new Error("Missing API.PATHS.AUTHORIZATION value"));
    }

    try {
      const headers = {
        "session-id": req.session.tokenId,
        session_id: req.session.tokenId,
        ...createPersonalDataHeaders(
          `${req.app.get("API.BASE_URL")}${req.app.get("API.PATHS.AUTHORIZATION")}`,
          req,
        ),
      };

      const authCode = await req.axios.get(authorizationPath, {
        params: {
          client_id: req.session.authParams.client_id,
          state: req.session.authParams.state,
          redirect_uri: req.session.authParams.redirect_uri,
          response_type: "code",
          scope: "openid",
        },
        headers,
      });

      req.session.authParams.authorization_code =
        authCode.data?.authorizationCode?.value;

      return next();
    } catch (e) {
      return next(e);
    }
  },

  redirectToCallback: async (req, res, next) => {
    try {
      const redirectUrl = buildRedirectUrl({
        authParams: req.session.authParams,
      });

      logger.info("Redirecting to callback");

      return res.redirect(redirectUrl.toString());
    } catch (e) {
      return next(e);
    }
  },

  redirectToEntryPoint: async (req, res, next) => {
    const entryPointPath = req.app.get("APP.PATHS.ENTRYPOINT");
    if (!entryPointPath) {
      return next(new Error("Missing APP.PATHS.ENTRYPOINT value"));
    }

    res.redirect(entryPointPath);
  },
};
