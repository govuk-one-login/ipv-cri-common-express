const middleware = require("./middleware");

const exampleJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const buildMocks = () => ({
  req: {
    customFetch: sinon.fake(),
    app: { get: sinon.stub() },
    session: {},
    headers: {},
    body: {},
    query: {},
    ip: "127.0.0.1",
  },
  res: { redirect: sinon.spy() },
  next: sinon.fake(),
});

function buildResponseWithBody(body, statusCode) {
  return {
    statusCode: statusCode ?? 200,
    json: sinon.stub().resolves(body),
  };
}

describe("oauth middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    const setup = buildMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;
  });

  afterEach(() => {
    require("../../bootstrap/lib/logger").get().error.resetHistory();
  });

  describe("addAuthParamsToSession", () => {
    beforeEach(() => {
      req = {
        query: {
          client_id: "s6BhdRkqt3",
          unusedParam: "not used",
        },
        session: {},
      };
    });

    it("should save authParams to session", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(req.session.authParams).to.deep.equal({
        client_id: req.query.client_id,
      });
    });

    it("should call next", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("addJWTToRequest", () => {
    beforeEach(() => {
      req = {
        query: {
          request: exampleJwt,
        },
      };
    });

    it("should save authParams to session", async function () {
      await middleware.addJWTToRequest(req, res, next);

      expect(req.jwt).to.equal(req.query.request);
    });

    it("should call next", async function () {
      await middleware.addJWTToRequest(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("initSessionWithJWT", () => {
    let response;

    beforeEach(() => {
      req.jwt = exampleJwt;
      req.query = {
        client_id: "s6BhdRkqt3",
      };
      req.session = {
        authParams: {
          client_id: "s6BhdRkqt3",
        },
      };

      response = buildResponseWithBody({
        session_id: "abc1234",
      });
    });

    context("with missing properties", () => {
      it("should call next with an error when req.jwt is missing", async () => {
        delete req.jwt;

        await middleware.initSessionWithJWT(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing JWT")),
        );
      });

      it("should call next with an error when req.session.authParams is missing", async () => {
        delete req.session.authParams;

        await middleware.initSessionWithJWT(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing client_id")),
        );
      });

      it("should call next with an error when API.PATHS.SESSION is missing", async () => {
        await middleware.initSessionWithJWT(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing API.PATHS.SESSION value")),
        );
      });
    });

    context("on authorization request", () => {
      beforeEach(() => {
        req.app = {
          get: sinon.stub(),
        };
        req.app.get.withArgs("API.PATHS.SESSION").returns("/api/authorize");
        req.app.get.withArgs("API.BASE_URL").returns("http://localhost:3000");

        req.headers = {
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "198.51.100.10:46532",
        };
      });

      it("should call the authorize endpoint with the correct parameters", async function () {
        await middleware.initSessionWithJWT(req, res, next);
        expect(req.customFetch).to.have.been.calledWith("/api/authorize", {
          method: "POST",
          headers: {
            "txma-audit-encoded": "dummy-txma-header",
            "x-forwarded-for": "127.0.0.1",
          },
          jsonBody: {
            request: exampleJwt,
            client_id: req.session.authParams.client_id,
          },
        });
      });

      context("with API result", () => {
        beforeEach(async () => {
          response = buildResponseWithBody({
            session_id: "abc1234",
            state: "rAnd0m-i5ed_STring",
            redirect_uri: "http://example.org:9001/callback",
          });
          req.customFetch = sinon.fake.returns(response);

          await middleware.initSessionWithJWT(req, res, next);
        });

        it("should save 'session_id' into req.session", () => {
          expect(req.session.tokenId).to.equal("abc1234");
        });

        it("should save 'state' into req.session.authParams", () => {
          expect(req.session.authParams.state).to.equal("rAnd0m-i5ed_STring");
        });

        it("should save 'redirect_uri' into req.session.authParams", () => {
          expect(req.session.authParams.redirect_uri).to.equal(
            "http://example.org:9001/callback",
          );
        });
        it("should call next", function () {
          expect(next).to.have.been.called;
        });
      });

      context("with API error", () => {
        beforeEach(async () => {
          req.customFetch = sinon.fake.throws(new Error("API error"));

          await middleware.initSessionWithJWT(req, res, next);
        });

        it("should call next with error", () => {
          expect(next).to.have.been.calledWith(
            sinon.match
              .instanceOf(Error)
              .and(sinon.match.has("message", "API error")),
          );
        });
      });
    });
  });

  describe("retrieveAuthorizationCode", () => {
    let response;

    beforeEach(() => {
      req.app = {
        get: sinon.stub(),
      };

      req.session = {
        tokenId: "abc123",
        authParams: {
          client_id: "test_client",
          state: "sT@t3",
          redirect_uri: "http://example.net/",
        },
      };

      response = buildResponseWithBody({
        authorizationCode: {
          value: "auth000",
        },
      });
    });

    context("with missing properties", () => {
      it("should call next with an error when req.session.tokenId is missing", async () => {
        delete req.session.tokenId;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing session-id")),
        );
      });

      it("should call next with an error when req.session.authParams.client_id is missing", async () => {
        delete req.session.authParams.client_id;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing client_id")),
        );
      });

      it("should call next with an error when req.session.authParams.redirect_uri is missing", async () => {
        delete req.session.authParams.redirect_uri;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing redirect_uri")),
        );
      });

      it("should call next with an error when API.PATHS.AUTHORIZATION is missing", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(
              sinon.match.has(
                "message",
                "Missing API.PATHS.AUTHORIZATION value",
              ),
            ),
        );
      });
    });

    context("on authorization request", () => {
      beforeEach(() => {
        req.app.get
          .withArgs("API.PATHS.AUTHORIZATION")
          .returns("/api/authorize");
        req.app.get.withArgs("API.PATHS.SESSION").returns("/api/authorize");
        req.app.get.withArgs("API.BASE_URL").returns("http://localhost:3000");

        req.headers = {
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "198.51.100.10:46532",
        };
      });

      it("should call the auth code endpoint with the correct parameters", async function () {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(req.customFetch).to.have.been.calledWith(
          "/api/authorize?client_id=test_client&state=sT%40t3&redirect_uri=http%3A%2F%2Fexample.net%2F&response_type=code&scope=openid",
          {
            headers: {
              "session-id": req.session.tokenId,
              session_id: req.session.tokenId,
              "txma-audit-encoded": "dummy-txma-header",
              "x-forwarded-for": "127.0.0.1",
            },
          },
        );
      });

      context("with API result", () => {
        beforeEach(async () => {
          req.customFetch = sinon.fake.returns(response);

          await middleware.retrieveAuthorizationCode(req, res, next);
        });

        it("should save 'authorization_code' into req.session.authParams", () => {
          expect(req.session.authParams.authorization_code).to.equal("auth000");
        });

        it("should call next", function () {
          expect(next).to.have.been.calledWith();
        });
      });

      context("with API error", () => {
        beforeEach(async () => {
          req.customFetch = sinon.fake.throws(new Error("API error"));

          await middleware.retrieveAuthorizationCode(req, res, next);
        });

        it("should call next with error", () => {
          expect(next).to.have.been.calledWith(
            sinon.match
              .instanceOf(Error)
              .and(sinon.match.has("message", "API error")),
          );
        });
      });
    });
  });

  describe("redirectToCallback", () => {
    let redirect, state, clientId, code;

    beforeEach(() => {
      redirect = "https://client.example.com/cb";
      state = "abc1";
      clientId = "543";
      code = "123-acb-xyz";

      req.session = {
        authParams: {
          client_id: clientId,
          authorization_code: code,
          redirect_uri: redirect,
          state,
        },
      };

      req.customFetch = sinon.fake.returns({});
    });

    it("should successfully redirects when code is valid", async () => {
      await middleware.redirectToCallback(req, res, next);

      expect(res.redirect).to.have.been.calledWith(
        `${redirect}?client_id=${clientId}&code=${code}&state=${state}`,
      );
    });

    it("should redirects with error when error present", async () => {
      delete req.session.authParams.authorization_code;

      const errorCode = "123";
      const description = "myDescription";

      req.session.authParams.error = {
        code: errorCode,
        description: description,
      };

      await middleware.redirectToCallback(req, res, next);

      expect(res.redirect).to.have.been.calledWith(
        `${redirect}?error=${errorCode}&error_description=${description}&state=${state}`,
      );
    });

    it("should call next with URL error if redirect_uri not present", async () => {
      delete req.session.authParams.redirect_uri;

      await middleware.redirectToCallback(req, res, next);

      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(TypeError)
          .and(sinon.match.has("code", "ERR_INVALID_URL")),
      );
    });

    context("with session.save available", () => {
      let notifySessionSaved;

      beforeEach(() => {
        res.redirect = sinon.stub();
        notifySessionSaved = undefined;
        req.session.save = sinon.stub().callsFake((sessionSavedCallback) => {
          notifySessionSaved = sessionSavedCallback;
        });
      });

      it("does not redirect until the session has finished saving", async () => {
        await middleware.redirectToCallback(req, res, next);

        expect(req.session.save).to.have.been.calledOnce;
        expect(res.redirect).to.not.have.been.called;

        notifySessionSaved(null); // success

        expect(res.redirect).to.have.been.calledOnce;
      });

      it("still redirects if the session save fails", async () => {
        await middleware.redirectToCallback(req, res, next);

        notifySessionSaved(new Error("session save failed"));

        expect(res.redirect).to.have.been.calledOnce;
      });
    });
  });

  describe("redirectToAddress", () => {
    beforeEach(() => {
      req.customFetch = sinon.fake.returns({});
      req.app = {
        get: sinon.stub(),
      };
      res.redirect = sinon.stub();
    });

    it("should successfully redirect back to address", async function () {
      req.app.get.withArgs("APP.PATHS.ENTRYPOINT").returns("/app/entry");

      await middleware.redirectToEntryPoint(req, res, next);

      expect(res.redirect).to.have.been.calledWith("/app/entry");
    });

    context("with session.save available", () => {
      let notifySessionSaved;

      beforeEach(() => {
        req.app.get.withArgs("APP.PATHS.ENTRYPOINT").returns("/app/entry");
        notifySessionSaved = undefined;
        req.session.save = sinon.stub().callsFake((sessionSavedCallback) => {
          notifySessionSaved = sessionSavedCallback;
        });
      });

      it("does not redirect until the session has finished saving", async () => {
        await middleware.redirectToEntryPoint(req, res, next);

        expect(req.session.save).to.have.been.calledOnce;
        expect(res.redirect).to.not.have.been.called;

        notifySessionSaved(null); // success

        expect(res.redirect).to.have.been.calledOnce;
      });

      it("still redirects if the session save fails", async () => {
        await middleware.redirectToEntryPoint(req, res, next);

        notifySessionSaved(new Error("session save failed"));

        expect(res.redirect).to.have.been.calledOnce;
      });
    });

    context("with missing APP.PATHS.ENTRYPOINT", () => {
      it("should call next with error", async () => {
        await middleware.redirectToEntryPoint(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(
              sinon.match.has("message", "Missing APP.PATHS.ENTRYPOINT value"),
            ),
        );
      });
    });
  });
});
