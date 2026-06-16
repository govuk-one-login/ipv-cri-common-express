const token = require("./token");
const CsrfError = require("./error");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TOKEN_FIELD = "_csrf";
const TOKEN_HEADER = "x-csrf-token";

const extractToken = (req) =>
  req.body?.[TOKEN_FIELD] ?? req.headers?.[TOKEN_HEADER];

const normaliseSecrets = (secret) => {
  const candidates = Array.isArray(secret) ? secret : [secret];
  if (candidates.length === 0) {
    throw new Error("csrf middleware requires a non-empty 'secret' option");
  }
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length === 0) {
      throw new Error("csrf middleware requires a non-empty 'secret' option");
    }
  }
  return candidates;
};

const csrf = ({ secret } = {}) => {
  const secrets = normaliseSecrets(secret);

  return function csrfMiddleware(req, res, next) {
    if (!req.session) {
      return next(new CsrfError("CSRF middleware requires a session"));
    }

    if (!req.session.csrfSecret) {
      req.session.csrfSecret = token.setSessionSecret();
    }

    res.locals.csrfToken = token.create(secrets, req.session.csrfSecret);

    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const submitted = extractToken(req);
    if (!token.verify(secrets, req.session.csrfSecret, submitted)) {
      return next(new CsrfError());
    }

    return next();
  };
};

module.exports = csrf;
