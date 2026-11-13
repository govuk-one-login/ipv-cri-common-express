import { vi, expect, describe, beforeEach, it } from "vitest";

const { buildCsrfMiddleware } = require("../../../src/lib/csrf/middleware");
const CsrfError = require("../../../src/lib/csrf/error");
const token = require("../../../src/lib/csrf/token");

const SECRET = "hunter2"; // pragma: allowlist secret
const SESSION_CSRF_SECRET = "top-secret"; // pragma: allowlist secret

const buildReq = (overrides = {}) => ({
  method: "GET",
  session: { csrfSecret: SESSION_CSRF_SECRET },
  body: {},
  headers: {},
  ...overrides,
});

const buildRes = () => ({ locals: {} });

describe("lib/csrf/middleware", () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  describe("configuration", () => {
    it("throws when no secret is provided", () => {
      expect(() => buildCsrfMiddleware()).toThrow(/secret/);
      expect(() => buildCsrfMiddleware({})).toThrow(/secret/);
      expect(() => buildCsrfMiddleware({ secret: "" })).toThrow(/secret/);
      expect(() => buildCsrfMiddleware({ secret: 123 })).toThrow(/secret/);
    });

    it("throws when secret is an empty array", () => {
      expect(() => buildCsrfMiddleware({ secret: [] })).toThrow(/secret/);
    });

    it("throws when secret array contains invalid entries", () => {
      expect(() => buildCsrfMiddleware({ secret: ["valid", ""] })).toThrow(
        /secret/,
      );
      expect(() => buildCsrfMiddleware({ secret: ["valid", 42] })).toThrow(
        /secret/,
      );
    });

    it("returns middleware when given a secret string", () => {
      expect(typeof buildCsrfMiddleware({ secret: SECRET })).toBe("function");
    });

    it("returns middleware when given a secret array", () => {
      expect(typeof buildCsrfMiddleware({ secret: [SECRET, "previous"] })).toBe(
        "function",
      );
    });
  });

  describe("session requirement", () => {
    it("calls next with CsrfError when no session exists", () => {
      const req = buildReq();
      delete req.session;

      buildCsrfMiddleware({ secret: SECRET })(req, buildRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(CsrfError);
      expect(err.status).toEqual(403);
      expect(err.code).toEqual("BAD_CSRF_TOKEN");
    });
  });

  describe("safe methods", () => {
    ["GET", "HEAD", "OPTIONS"].forEach((method) => {
      it(`sets res.locals.csrfToken and calls next() for ${method}`, () => {
        const req = buildReq({ method });
        const res = buildRes();

        buildCsrfMiddleware({ secret: SECRET })(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(typeof res.locals.csrfToken).toBe("string");
        expect(
          token.verifyCsrfToken(
            [SECRET],
            req.session.csrfSecret,
            res.locals.csrfToken,
          ),
        ).toEqual(true);
      });
    });

    it("generates and saves a session csrf secret when missing", () => {
      const req = buildReq({ session: {} });

      buildCsrfMiddleware({ secret: SECRET })(req, buildRes(), next);

      expect(typeof req.session.csrfSecret).toBe("string");
      expect(req.session.csrfSecret.length).toBeGreaterThan(0);
    });

    it("reuses an existing session csrf secret", () => {
      const session = {};
      const middleware = buildCsrfMiddleware({ secret: SECRET });

      middleware(buildReq({ session }), buildRes(), vi.fn());
      const first = session.csrfSecret;
      middleware(buildReq({ session }), buildRes(), vi.fn());

      expect(session.csrfSecret).to.equal(first);
    });

    it("returns a fresh token on each request within the same session", () => {
      const middleware = buildCsrfMiddleware({ secret: SECRET });

      const res1 = buildRes();
      middleware(buildReq(), res1, vi.fn());
      const res2 = buildRes();
      middleware(buildReq(), res2, vi.fn());

      expect(res1.locals.csrfToken).to.not.equal(res2.locals.csrfToken);
    });
  });

  describe("unsafe methods", () => {
    let middleware;
    let validToken;

    beforeEach(() => {
      middleware = buildCsrfMiddleware({ secret: SECRET });
      validToken = token.createCsrfToken([SECRET], SESSION_CSRF_SECRET);
    });

    ["POST", "PUT", "PATCH", "DELETE"].forEach((method) => {
      it(`accepts a valid token in req.body._csrf for ${method}`, () => {
        const req = buildReq({ method, body: { _csrf: validToken } });
        middleware(req, buildRes(), next);

        expect(next).toHaveBeenCalled();
      });
    });

    it("accepts a valid token in the x-csrf-token header", () => {
      const req = buildReq({
        method: "POST",
        headers: { "x-csrf-token": validToken },
      });
      middleware(req, buildRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it("prefers the body field over the header", () => {
      const req = buildReq({
        method: "POST",
        body: { _csrf: validToken },
        headers: { "x-csrf-token": "invalid_token" },
      });
      middleware(req, buildRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it("calls next with CsrfError when token is missing", () => {
      const req = buildReq({ method: "POST" });
      middleware(req, buildRes(), next);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(CsrfError);
      expect(err.status).toEqual(403);
      expect(err.code).toEqual("BAD_CSRF_TOKEN");
    });

    it("calls next with CsrfError when token is invalid", () => {
      const req = buildReq({ method: "POST", body: { _csrf: "BAAD.F00D" } });
      middleware(req, buildRes(), next);

      expect(next.mock.calls[0][0]).toBeInstanceOf(CsrfError);
    });

    it("rejects a token created for a different session", () => {
      const otherToken = token.createCsrfToken(
        [SECRET],
        "other-session-secret",
      );
      const req = buildReq({ method: "POST", body: { _csrf: otherToken } });
      middleware(req, buildRes(), next);

      expect(next.mock.calls[0][0]).toBeInstanceOf(CsrfError);
    });

    it("sets res.locals.csrfToken when verification succeeds", () => {
      const req = buildReq({ method: "POST", body: { _csrf: validToken } });
      const res = buildRes();
      middleware(req, res, next);

      expect(typeof res.locals.csrfToken).toBe("string");
    });
  });

  describe("secret rotation", () => {
    it("accepts a POST with a token signed by a previously-accepted secret", () => {
      const oldToken = token.createCsrfToken(
        ["old-secret"],
        SESSION_CSRF_SECRET,
      );
      const middleware = buildCsrfMiddleware({
        secret: ["new-secret", "old-secret"],
      });
      const req = buildReq({ method: "POST", body: { _csrf: oldToken } });

      middleware(req, buildRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it("signs new tokens with the first secret during rotation", () => {
      const middleware = buildCsrfMiddleware({
        secret: ["new-secret", "old-secret"],
      });
      const req = buildReq({ method: "GET" });
      const res = buildRes();

      middleware(req, res, next);

      expect(
        token.verifyCsrfToken(
          ["new-secret"],
          req.session.csrfSecret,
          res.locals.csrfToken,
        ),
      ).toEqual(true);
      expect(
        token.verifyCsrfToken(
          ["old-secret"],
          req.session.csrfSecret,
          res.locals.csrfToken,
        ),
      ).toEqual(false);
    });

    it("rejects tokens signed by the old secret once it's removed from the list", () => {
      const oldToken = token.createCsrfToken(
        ["old-secret"],
        SESSION_CSRF_SECRET,
      );
      const middleware = buildCsrfMiddleware({ secret: "new-secret" });
      const req = buildReq({ method: "POST", body: { _csrf: oldToken } });

      middleware(req, buildRes(), next);

      expect(next.mock.calls[0][0]).toBeInstanceOf(CsrfError);
    });
  });
});
