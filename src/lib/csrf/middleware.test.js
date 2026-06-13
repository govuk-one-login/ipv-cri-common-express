const csrf = require("./middleware");
const CsrfError = require("./error");
const token = require("./token");

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
    next = sinon.fake();
  });

  describe("configuration", () => {
    it("throws when no secret is provided", () => {
      expect(() => csrf()).to.throw(/secret/);
      expect(() => csrf({})).to.throw(/secret/);
      expect(() => csrf({ secret: "" })).to.throw(/secret/);
      expect(() => csrf({ secret: 123 })).to.throw(/secret/);
    });

    it("throws when secret is an empty array", () => {
      expect(() => csrf({ secret: [] })).to.throw(/secret/);
    });

    it("throws when secret array contains invalid entries", () => {
      expect(() => csrf({ secret: ["valid", ""] })).to.throw(/secret/);
      expect(() => csrf({ secret: ["valid", 42] })).to.throw(/secret/);
    });

    it("returns middleware when given a secret string", () => {
      expect(csrf({ secret: SECRET })).to.be.a("function");
    });

    it("returns middleware when given a secret array", () => {
      expect(csrf({ secret: [SECRET, "previous"] })).to.be.a("function");
    });
  });

  describe("session requirement", () => {
    it("calls next with CsrfError when no session exists", () => {
      const req = buildReq();
      delete req.session;

      csrf({ secret: SECRET })(req, buildRes(), next);

      expect(next).to.have.been.calledOnce;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(CsrfError);
      expect(err.status).to.equal(403);
      expect(err.code).to.equal("BAD_CSRF_TOKEN");
    });
  });

  describe("safe methods", () => {
    ["GET", "HEAD", "OPTIONS"].forEach((method) => {
      it(`sets res.locals.csrfToken and calls next() for ${method}`, () => {
        const req = buildReq({ method });
        const res = buildRes();

        csrf({ secret: SECRET })(req, res, next);

        expect(next).to.have.been.calledOnceWithExactly();
        expect(res.locals.csrfToken).to.be.a("string");
        expect(
          token.verify([SECRET], req.session.csrfSecret, res.locals.csrfToken),
        ).to.equal(true);
      });
    });

    it("generates and saves a session csrf secret when missing", () => {
      const req = buildReq({ session: {} });

      csrf({ secret: SECRET })(req, buildRes(), next);

      expect(req.session.csrfSecret).to.be.a("string");
      expect(req.session.csrfSecret.length).to.be.greaterThan(0);
    });

    it("reuses an existing session csrf secret", () => {
      const session = {};
      const middleware = csrf({ secret: SECRET });

      middleware(buildReq({ session }), buildRes(), sinon.fake());
      const first = session.csrfSecret;
      middleware(buildReq({ session }), buildRes(), sinon.fake());

      expect(session.csrfSecret).to.equal(first);
    });

    it("returns a fresh token on each request within the same session", () => {
      const middleware = csrf({ secret: SECRET });

      const res1 = buildRes();
      middleware(buildReq(), res1, sinon.fake());
      const res2 = buildRes();
      middleware(buildReq(), res2, sinon.fake());

      expect(res1.locals.csrfToken).to.not.equal(res2.locals.csrfToken);
    });
  });

  describe("unsafe methods", () => {
    let middleware;
    let validToken;

    beforeEach(() => {
      middleware = csrf({ secret: SECRET });
      validToken = token.create([SECRET], SESSION_CSRF_SECRET);
    });

    ["POST", "PUT", "PATCH", "DELETE"].forEach((method) => {
      it(`accepts a valid token in req.body._csrf for ${method}`, () => {
        const req = buildReq({ method, body: { _csrf: validToken } });
        middleware(req, buildRes(), next);

        expect(next).to.have.been.calledOnceWithExactly();
      });
    });

    it("accepts a valid token in the x-csrf-token header", () => {
      const req = buildReq({
        method: "POST",
        headers: { "x-csrf-token": validToken },
      });
      middleware(req, buildRes(), next);

      expect(next).to.have.been.calledOnceWithExactly();
    });

    it("prefers the body field over the header", () => {
      const req = buildReq({
        method: "POST",
        body: { _csrf: validToken },
        headers: { "x-csrf-token": "invalid_token" },
      });
      middleware(req, buildRes(), next);

      expect(next).to.have.been.calledOnceWithExactly();
    });

    it("calls next with CsrfError when token is missing", () => {
      const req = buildReq({ method: "POST" });
      middleware(req, buildRes(), next);

      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(CsrfError);
      expect(err.status).to.equal(403);
      expect(err.code).to.equal("BAD_CSRF_TOKEN");
    });

    it("calls next with CsrfError when token is invalid", () => {
      const req = buildReq({ method: "POST", body: { _csrf: "BAAD.F00D" } });
      middleware(req, buildRes(), next);

      expect(next.firstCall.args[0]).to.be.instanceOf(CsrfError);
    });

    it("rejects a token created for a different session", () => {
      const otherToken = token.create([SECRET], "other-session-secret");
      const req = buildReq({ method: "POST", body: { _csrf: otherToken } });
      middleware(req, buildRes(), next);

      expect(next.firstCall.args[0]).to.be.instanceOf(CsrfError);
    });

    it("sets res.locals.csrfToken when verification succeeds", () => {
      const req = buildReq({ method: "POST", body: { _csrf: validToken } });
      const res = buildRes();
      middleware(req, res, next);

      expect(res.locals.csrfToken).to.be.a("string");
    });
  });

  describe("secret rotation", () => {
    it("accepts a POST with a token signed by a previously-accepted secret", () => {
      const oldToken = token.create(["old-secret"], SESSION_CSRF_SECRET);
      const middleware = csrf({ secret: ["new-secret", "old-secret"] });
      const req = buildReq({ method: "POST", body: { _csrf: oldToken } });

      middleware(req, buildRes(), next);

      expect(next).to.have.been.calledOnceWithExactly();
    });

    it("signs new tokens with the first secret during rotation", () => {
      const middleware = csrf({ secret: ["new-secret", "old-secret"] });
      const req = buildReq({ method: "GET" });
      const res = buildRes();

      middleware(req, res, next);

      expect(
        token.verify(
          ["new-secret"],
          req.session.csrfSecret,
          res.locals.csrfToken,
        ),
      ).to.equal(true);
      expect(
        token.verify(
          ["old-secret"],
          req.session.csrfSecret,
          res.locals.csrfToken,
        ),
      ).to.equal(false);
    });

    it("rejects tokens signed by the old secret once it's removed from the list", () => {
      const oldToken = token.create(["old-secret"], SESSION_CSRF_SECRET);
      const middleware = csrf({ secret: "new-secret" });
      const req = buildReq({ method: "POST", body: { _csrf: oldToken } });

      middleware(req, buildRes(), next);

      expect(next.firstCall.args[0]).to.be.instanceOf(CsrfError);
    });
  });
});
