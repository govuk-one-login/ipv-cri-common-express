import { describe, vi, expect, beforeEach, it } from "vitest";
import { createDefaultReqResNext } from "../../test/utils/helpers";

const proxyquire = require("proxyquire");
const { CustomFetchHttpError } = require("./custom-fetch");

const oAuthStub = {};
const { redirectAsErrorToCallback } = proxyquire("./error-handling", {
  "./oauth": oAuthStub,
});

function buildErrorWithBody(body, contentType = "application/json") {
  return new CustomFetchHttpError(
    {
      status: 400,
      statusText: "Bad Request",
      ok: false,
      headers: new Headers(contentType ? { "Content-Type": contentType } : {}),
    },
    JSON.stringify(body),
  );
}

describe("error-handling", () => {
  let req;
  let res;
  let next;
  let err;

  beforeEach(() => {
    const setup = createDefaultReqResNext();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.session = {
      authParams: { redirect_uri: "http://example.org" },
    };

    oAuthStub.buildRedirectUrl = vi.fn();
  });

  describe("redirectAsErrorToCallbackWithoutOauthPrefix", () => {
    describe("with HTTP errors", () => {
      beforeEach(() => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          message: "Invalid request JWT",
          code: "invalid_request_object",
        });
      });

      it("should override error values if provided in response body without Oauth Prefix", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: {
              redirect_uri: "http://error.example.org",
              error: {
                code: "invalid_request_object",
                description: "Invalid request JWT",
              },
            },
          }),
        );
      });

      it("should use a default for error code", async () => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          message: "Invalid request JWT",
          code: undefined,
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: expect.objectContaining({
                code: "server_error",
              }),
            }),
          }),
        );
      });
      it("should use a default for error description", async () => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          message: undefined,
          code: "invalid_request_object",
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: expect.objectContaining({
                description: "general error",
              }),
            }),
          }),
        );
      });
      it("should use a default for redirect_uri", async () => {
        err = buildErrorWithBody({
          redirect_uri: undefined,
          message: "Invalid request JWT",
          code: "invalid_request_object",
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              redirect_uri: "http://example.org",
            }),
          }),
        );
      });
    });

    describe("with default Error object", () => {
      beforeEach(async () => {
        err = new Error("error message");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should build redirect with default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith({
          authParams: {
            error: { code: "server_error", description: "general error" },
            redirect_uri: "http://example.org",
          },
        });
      });
    });

    describe("with valid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        oAuthStub.buildRedirectUrl.mockReturnValue("http://example.org");
        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should call res.redirect with redirect_uri", () => {
        expect(res.redirect).toHaveBeenCalledWith("http://example.org");
      });

      it("should not call next", () => {
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe("with invalid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        req.session.authParams.redirect_uri = "not-a-url";
        oAuthStub.buildRedirectUrl.mockThrow("parse error");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.toHaveBeenCalled();
      });
      it("should call next with err", () => {
        expect(next).to.have.been.calledWith(err);
      });
    });
  });

  describe("redirectAsErrorToCallback", () => {
    describe("with HTTP errors", () => {
      beforeEach(() => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          oauth_error: {
            error_description: "Invalid request JWT",
            error: "invalid_request_object",
          },
        });
      });

      it("should override error values if provided in response body", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: {
              redirect_uri: "http://error.example.org",
              error: {
                code: "invalid_request_object",
                description: "Invalid request JWT",
              },
            },
          }),
        );
      });

      it("should use a default for error code", async () => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          oauth_error: {
            error_description: "Invalid request JWT",
            error: undefined,
          },
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: expect.objectContaining({
                code: "server_error",
              }),
            }),
          }),
        );
      });
      it("should use a default for error description", async () => {
        err = buildErrorWithBody({
          redirect_uri: "http://error.example.org",
          oauth_error: {
            error_description: undefined,
            error: "invalid_request_object",
          },
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: expect.objectContaining({
                description: "general error",
              }),
            }),
          }),
        );
      });
      it("should use a default for redirect_uri", async () => {
        err = buildErrorWithBody({
          redirect_uri: undefined,
          oauth_error: {
            error_description: "Invalid request JWT",
            error: "invalid_request_object",
          },
        });

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              redirect_uri: "http://example.org",
            }),
          }),
        );
      });
    });

    describe("with HTTP errors and no Content-Type header", () => {
      beforeEach(() => {
        err = buildErrorWithBody(
          {
            redirect_uri: "http://error.example.org",
            oauth_error: {
              error_description: "gateway",
              error: "server_error",
            },
          },
          null,
        );
      });

      it("should still parse the body and override error values", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: {
              redirect_uri: "http://error.example.org",
              error: {
                code: "server_error",
                description: "gateway",
              },
            },
          }),
        );
      });
    });

    describe("with HTTP errors and a Content-Type charset suffix", () => {
      beforeEach(() => {
        err = buildErrorWithBody(
          {
            redirect_uri: "http://error.example.org",
            oauth_error: {
              error_description: "gateway",
              error: "server_error",
            },
          },
          "application/json; charset=utf-8",
        );
      });

      it("should still parse the body and override error values", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: {
              redirect_uri: "http://error.example.org",
              error: {
                code: "server_error",
                description: "gateway",
              },
            },
          }),
        );
      });
    });

    describe("with an HTTP error body that is not valid JSON", () => {
      let warn;

      beforeEach(async () => {
        warn = require("../bootstrap/lib/logger").get().warn;
        warn.mockClear();

        err = new CustomFetchHttpError(
          {
            status: 500,
            statusText: "Internal Server Error",
            ok: false,
            headers: new Headers(),
          },
          "<html>not json</html>",
        );

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should log a warning that the body could not be parsed", () => {
        expect(warn).toHaveBeenCalledWith(
          "Unable to parse HTTP response body as JSON",
        );
      });

      it("should fall back to the default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: { code: "server_error", description: "general error" },
            }),
          }),
        );
      });
    });

    describe("with an HTTP error that has no body", () => {
      let loggerStub;

      beforeEach(async () => {
        loggerStub = LOGGER_RESET();
        err = new CustomFetchHttpError(
          {
            status: 500,
            statusText: "Internal Server Error",
            ok: false,
            headers: new Headers(),
          },
          "",
        );

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not attempt to parse the body or log a warning", () => {
        expect(loggerStub.warn).not.toHaveBeenCalled();
      });

      it("should fall back to the default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            authParams: expect.objectContaining({
              error: { code: "server_error", description: "general error" },
            }),
          }),
        );
      });
    });

    describe("with default Error object", () => {
      beforeEach(async () => {
        err = new Error("error message");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should build redirect with default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).toHaveBeenCalledWith({
          authParams: {
            error: { code: "server_error", description: "general error" },
            redirect_uri: "http://example.org",
          },
        });
      });
    });

    describe("with valid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        oAuthStub.buildRedirectUrl.mockReturnValue("http://example.org");
        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should call res.redirect with redirect_uri", () => {
        expect(res.redirect).toHaveBeenCalledWith("http://example.org");
      });

      it("should not call next", () => {
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe("with invalid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        req.session.authParams.redirect_uri = "not-a-url";
        oAuthStub.buildRedirectUrl.mockImplementation(() => {
          throw new Error("parse error");
        });

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.toHaveBeenCalled();
      });
      it("should call next with err", () => {
        expect(next).toHaveBeenCalledWith(err);
      });
    });

    describe("with a missing redirect_uri", () => {
      beforeEach(async () => {
        err = new Error("Missing redirect_uri");

        req.session = {
          authParams: undefined,
        };

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.toHaveBeenCalled();
      });

      it("should call next with err", () => {
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing redirect_uri");
      });
    });

    describe("with no redirect_uri but an existing session", () => {
      beforeEach(async () => {
        err = new Error("some other error");

        req.session = {
          tokenId: "some-token-id",
          authParams: { redirect_uri: undefined, state: undefined },
        };

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.toHaveBeenCalled();
      });

      it("should call next with a 'Missing redirect_uri' error", () => {
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Missing redirect_uri");
      });
    });

    describe("with a missing redirect_uri, tokenId, and state", () => {
      beforeEach(async () => {
        req.session = {
          authParams: {
            redirect_uri: undefined,
            state: undefined,
          },
          tokenId: undefined,
        };

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.toHaveBeenCalled();
      });
      it("should call next with err MISSING_AUTHPARAMS code", () => {
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({ code: "MISSING_AUTHPARAMS" }),
        );
      });
    });

    describe("with a static asset request", () => {
      beforeEach(async () => {
        err = new Error(
          "Cannot read properties of undefined (reading 'language')",
        );
        req.path = "/public/govuk/govuk-frontend.min.js.map";

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not redirect the asset request to the callback", () => {
        expect(res.redirect).not.to.have.been.called;
        expect(oAuthStub.buildRedirectUrl).not.to.have.been.called;
      });

      it("should pass the error through to next", () => {
        expect(next).toHaveBeenCalledWith(err);
      });
    });

    describe("MISSING_SESSION_DATA error", () => {
      beforeEach(() => {
        err = {
          code: "MISSING_SESSION_DATA",
          status: 401,
        };
      });
      it("should call next with err MISSING_SESSION_DATA code", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(next).to.have.been.calledWith({
          code: "MISSING_SESSION_DATA",
          status: 401,
        });
      });
      it("should not call res.redirect", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(res.redirect).not.to.have.been.called;
      });
      it("should prioritise MISSING_SESSION_DATA before MISSING_AUTHPARAMS when error code explictly set in err ", async () => {
        req.session = {
          authParams: {
            redirect_uri: undefined,
            state: undefined,
          },
          tokenId: undefined,
        };

        await redirectAsErrorToCallback(err, req, res, next);

        expect(next).to.have.been.calledWith({
          code: "MISSING_SESSION_DATA",
          status: 401,
        });
        expect(res.redirect).not.toHaveBeenCalled();
      });
    });
  });
});
