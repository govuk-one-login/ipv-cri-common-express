import { setSessionSecret, createCsrfToken, verifyCsrfToken } from "./token.js";

export class CsrfError extends Error {
  constructor(message = "Invalid CSRF token") {
    super(message);
    this.name = "CsrfError";
    this.code = "BAD_CSRF_TOKEN";
    this.status = 403;
  }
}

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

export const buildCsrfMiddleware = ({ secret } = {}) => {
  const secrets = normaliseSecrets(secret);

  return function csrfMiddleware(req, res, next) {
    if (!req.session) {
      return next(new CsrfError("CSRF middleware requires a session"));
    }

    if (!req.session.csrfSecret) {
      req.session.csrfSecret = setSessionSecret();
    }

    res.locals.csrfToken = createCsrfToken(secrets, req.session.csrfSecret);

    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const submitted = extractToken(req);
    if (!verifyCsrfToken(secrets, req.session.csrfSecret, submitted)) {
      return next(new CsrfError());
    }

    return next();
  };
};
