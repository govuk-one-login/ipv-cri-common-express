import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";

const middleware = require("./middleware");

const exampleJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const buildMocks = () => ({
  req: {
    customFetch: vi.fn(),
    app: { get: vi.fn() },
    session: {},
    headers: {},
    body: {},
    query: {},
    ip: "127.0.0.1",
  },
  res: { redirect: vi.fn() },
  next: vi.fn(),
});

function buildResponseWithBody(body, statusCode) {
  return {
    statusCode: statusCode ?? 200,
    json: vi.fn().mockResolvedValue(body),
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
    require("../../bootstrap/lib/logger").get().error.mockClear();
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

      expect(req.session.authParams).toEqual({
        client_id: req.query.client_id,
      });
    });

    it("should call next", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(next).toHaveBeenCalled();
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
      middleware.addJWTToRequest(req, res, next);

      expect(req.jwt).toEqual(req.query.request);
    });

    it("should call next", async function () {
      middleware.addJWTToRequest(req, res, next);

      expect(next).toHaveBeenCalled();
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

    describe("with missing properties", () => {
      it("should call next with an error when req.jwt is missing", async () => {
        delete req.jwt;

        await middleware.initSessionWithJWT(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing JWT");
      });

      it("should call next with an error when req.session.authParams is missing", async () => {
        delete req.session.authParams;

        await middleware.initSessionWithJWT(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing client_id");
      });

      it("should call next with an error when API.PATHS.SESSION is missing", async () => {
        await middleware.initSessionWithJWT(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing API.PATHS.SESSION value");
      });
    });

    describe("on authorization request", () => {
      beforeEach(() => {
        req.app = {
          get: vi.fn(),
        };
        req.app.get.mockImplementation((arg) => {
          if (arg === "API.PATHS.SESSION") return "/api/authorize";
          if (arg === "API.BASE_URL") return "http://localhost:3000";
        });
        req.headers = {
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "198.51.100.10:46532",
        };
      });
      it("should call the authorize endpoint with the correct parameters", async function () {
        await middleware.initSessionWithJWT(req, res, next);

        expect(req.customFetch).toHaveBeenCalledWith("/api/authorize", {
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

      describe("with API result", () => {
        beforeEach(async () => {
          response = buildResponseWithBody({
            session_id: "abc1234",
            state: "rAnd0m-i5ed_STring",
            redirect_uri: "http://example.org:9001/callback",
            govuk_signin_journey_id: "test-journey-id",
          });
          req.customFetch = vi.fn().mockReturnValue(response);

          await middleware.initSessionWithJWT(req, res, next);
        });

        it("should save 'session_id' into req.session", () => {
          expect(req.session.tokenId).toEqual("abc1234");
        });

        it("should save 'state' into req.session.authParams", () => {
          expect(req.session.authParams.state).toEqual("rAnd0m-i5ed_STring");
        });

        it("should save 'redirect_uri' into req.session.authParams", () => {
          expect(req.session.authParams.redirect_uri).toEqual(
            "http://example.org:9001/callback",
          );
        });
        it("should save 'govuk_signin_journey_id' into req.session", () => {
          expect(req.session.govuk_signin_journey_id).toEqual(
            "test-journey-id",
          );
        });
        it("should call next", function () {
          expect(next).toHaveBeenCalled();
        });
      });

      describe("with API error", () => {
        beforeEach(async () => {
          req.customFetch = vi.fn(() => {
            throw new Error("API error");
          });

          await middleware.initSessionWithJWT(req, res, next);
        });

        it("should call next with error", () => {
          expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
          expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "API error",
            }),
          );
        });
      });
    });
  });

  describe("retrieveAuthorizationCode", () => {
    let response;

    beforeEach(() => {
      req.app = {
        get: vi.fn(),
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

    describe("with missing properties", () => {
      it("should call next with an error when req.session.tokenId is missing", async () => {
        delete req.session.tokenId;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing session-id");
      });

      it("should call next with an error when req.session.authParams.client_id is missing", async () => {
        delete req.session.authParams.client_id;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing client_id");
      });

      it("should call next with an error when req.session.authParams.redirect_uri is missing", async () => {
        delete req.session.authParams.redirect_uri;

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing redirect_uri");
      });

      it("should call next with an error when API.PATHS.AUTHORIZATION is missing", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing API.PATHS.AUTHORIZATION value");
      });
    });

    describe("on authorization request", () => {
      beforeEach(() => {
        req.app.get.mockImplementation((arg) => {
          if (arg === "API.PATHS.AUTHORIZATION") return "/api/authorize";
          if (arg === "API.PATHS.SESSION") return "/api/authorize";
          if (arg === "API.BASE_URL") return "http://localhost:3000";
        });
        req.headers = {
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "198.51.100.10:46532",
        };
      });

      it("should call the auth code endpoint with the correct parameters", async function () {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(req.customFetch).toHaveBeenCalledWith(
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

      describe("with API result", () => {
        beforeEach(async () => {
          req.customFetch = vi.fn().mockReturnValue(response);

          await middleware.retrieveAuthorizationCode(req, res, next);
        });

        it("should save 'authorization_code' into req.session.authParams", () => {
          expect(req.session.authParams.authorization_code).toEqual("auth000");
        });

        it("should call next", function () {
          expect(next).toHaveBeenCalledWith();
        });
      });

      describe("with API error", () => {
        beforeEach(async () => {
          req.customFetch = vi.fn(() => {
            throw new Error("API error");
          });

          await middleware.retrieveAuthorizationCode(req, res, next);
        });

        it("should call next with error", () => {
          expect(next).toHaveBeenCalled();
          const err = next.mock.calls[0][0];
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe("API error");
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

      req.customFetch = vi.fn().mockReturnValue({});
    });

    it("should successfully redirects when code is valid", async () => {
      await middleware.redirectToCallback(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
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

      expect(res.redirect).toHaveBeenCalledWith(
        `${redirect}?error=${errorCode}&error_description=${description}&state=${state}`,
      );
    });

    it("should call next with URL error if redirect_uri not present", async () => {
      delete req.session.authParams.redirect_uri;

      await middleware.redirectToCallback(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(TypeError);
      expect(err.code).toBe("ERR_INVALID_URL");
    });

    describe("with session.save available", () => {
      let notifySessionSaved;

      beforeEach(() => {
        res.redirect = vi.fn();
        notifySessionSaved = undefined;
        req.session.save = vi.fn((sessionSavedCallback) => {
          notifySessionSaved = sessionSavedCallback;
        });
      });

      it("does not redirect until the session has finished saving", async () => {
        await middleware.redirectToCallback(req, res, next);

        expect(req.session.save).toHaveBeenCalledTimes(1);
        expect(res.redirect).not.toHaveBeenCalled();

        notifySessionSaved(null); // success

        expect(res.redirect).toHaveBeenCalledTimes(1);
      });

      it("still redirects if the session save fails", async () => {
        await middleware.redirectToCallback(req, res, next);

        notifySessionSaved(new Error("session save failed"));

        expect(res.redirect).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("redirectToAddress", () => {
    beforeEach(() => {
      req.customFetch = vi.fn().mockReturnValue({});
      req.app = {
        get: vi.fn(),
      };
      res.redirect = vi.fn();
    });

    it("should successfully redirect back to address", async function () {
      req.app.get.mockImplementation((arg) => {
        if (arg === "APP.PATHS.ENTRYPOINT") return "/app/entry";
      });
      await middleware.redirectToEntryPoint(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith("/app/entry");
    });

    describe("with session.save available", () => {
      let notifySessionSaved;

      beforeEach(() => {
        req.app.get.mockImplementation((arg) => {
          if (arg === "APP.PATHS.ENTRYPOINT") return "/app/entry";
        });
        notifySessionSaved = undefined;
        req.session.save = vi.fn((sessionSavedCallback) => {
          notifySessionSaved = sessionSavedCallback;
        });
      });

      it("does not redirect until the session has finished saving", async () => {
        await middleware.redirectToEntryPoint(req, res, next);

        expect(req.session.save).toHaveBeenCalledTimes(1);
        expect(res.redirect).not.toHaveBeenCalled();

        notifySessionSaved(null); // success

        expect(res.redirect).toHaveBeenCalledTimes(1);
      });

      it("still redirects if the session save fails", async () => {
        await middleware.redirectToEntryPoint(req, res, next);

        notifySessionSaved(new Error("session save failed"));

        expect(res.redirect).toHaveBeenCalledTimes(1);
      });

      describe("with missing APP.PATHS.ENTRYPOINT", () => {
        it("should call next with error", async () => {
          req.app.get.mockImplementation(() => {});
          await middleware.redirectToEntryPoint(req, res, next);

          expect(next).toHaveBeenCalled();
          const err = next.mock.calls[0][0];
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe("Missing APP.PATHS.ENTRYPOINT value");
        });
      });
    });
  });
});
