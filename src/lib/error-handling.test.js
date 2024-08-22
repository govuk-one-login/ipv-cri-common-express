const proxyquire = require("proxyquire");

const oAuthStub = {};
const { redirectAsErrorToCallback } = proxyquire("./error-handling", {
  "./oauth": oAuthStub,
});

describe("error-handling", () => {
  let req;
  let res;
  let next;
  let err;

  beforeEach(() => {
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.session = {
      authParams: { redirect_uri: "http://example.org" },
    };

    oAuthStub.buildRedirectUrl = sinon.stub();
  });

  describe("redirectAsErrorToCallbackWithoutOauthPrefix", () => {
    context("with Axios error", () => {
      beforeEach(() => {
        err = {
          isAxiosError: true,
          response: {
            data: {
              redirect_uri: "http://error.example.org",
              message: "Invalid request JWT",
              code: "invalid_request_object",
            },
          },
        };
      });

      it("should override error code if provided in response body without Oauth Prefix", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                code: "invalid_request_object",
              },
            },
          }),
        );
      });

      it("should override error description if provided in response body without Oauth Prefix", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                description: "Invalid request JWT",
              },
            },
          }),
        );
      });

      it("should override redirect_uri if provided in response body without Oauth Prefix", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              redirect_uri: "http://error.example.org",
            },
          }),
        );
      });

      it("should use a default for error code", async () => {
        delete err.response.data.code;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                code: "server_error",
              },
            },
          }),
        );
      });
      it("should use a default for error description", async () => {
        delete err.response.data.message;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                description: "general error",
              },
            },
          }),
        );
      });
      it("should use a default for redirect_uri", async () => {
        delete err.response.data.redirect_uri;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              redirect_uri: "http://example.org",
            },
          }),
        );
      });
    });

    context("with default Error object", () => {
      beforeEach(async () => {
        err = new Error("error message");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should build redirect with default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith({
          authParams: {
            error: { code: "server_error", description: "general error" },
            redirect_uri: "http://example.org",
          },
        });
      });
    });

    context("with valid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        oAuthStub.buildRedirectUrl.returns("http://example.org");
        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should call res.redirect with redirect_uri", () => {
        expect(res.redirect).to.have.been.calledWith("http://example.org");
      });

      it("should not call next", () => {
        expect(next).not.to.have.been.called;
      });
    });

    context("with invalid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        req.session.authParams.redirect_uri = "not-a-url";
        oAuthStub.buildRedirectUrl.throws("parse error");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.to.have.been.called;
      });
      it("should call next with err", () => {
        expect(next).to.have.been.calledWith(err);
      });
    });
  });

  describe("redirectAsErrorToCallback", () => {
    context("with Axios error", () => {
      beforeEach(() => {
        err = {
          isAxiosError: true,
          response: {
            data: {
              redirect_uri: "http://error.example.org",
              oauth_error: {
                error_description: "Invalid request JWT",
                error: "invalid_request_object",
              },
            },
          },
        };
      });

      it("should override error code if provided in response body", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                code: "invalid_request_object",
              },
            },
          }),
        );
      });

      it("should override error description if provided in response body", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                description: "Invalid request JWT",
              },
            },
          }),
        );
      });

      it("should override redirect_uri if provided in response body", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              redirect_uri: "http://error.example.org",
            },
          }),
        );
      });

      it("should use a default for error code", async () => {
        delete err.response.data.oauth_error.error;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                code: "server_error",
              },
            },
          }),
        );
      });
      it("should use a default for error description", async () => {
        delete err.response.data.oauth_error.error_description;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              error: {
                description: "general error",
              },
            },
          }),
        );
      });
      it("should use a default for redirect_uri", async () => {
        delete err.response.data.redirect_uri;

        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              redirect_uri: "http://example.org",
            },
          }),
        );
      });
    });

    context("with default Error object", () => {
      beforeEach(async () => {
        err = new Error("error message");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should build redirect with default error code and description", () => {
        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith({
          authParams: {
            error: { code: "server_error", description: "general error" },
            redirect_uri: "http://example.org",
          },
        });
      });
    });

    context("with valid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        oAuthStub.buildRedirectUrl.returns("http://example.org");
        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should call res.redirect with redirect_uri", () => {
        expect(res.redirect).to.have.been.calledWith("http://example.org");
      });

      it("should not call next", () => {
        expect(next).not.to.have.been.called;
      });
    });

    context("with invalid redirect url", () => {
      beforeEach(async () => {
        err = new Error("error message");
        req.session.authParams.redirect_uri = "not-a-url";
        oAuthStub.buildRedirectUrl.throws("parse error");

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.to.have.been.called;
      });
      it("should call next with err", () => {
        expect(next).to.have.been.calledWith(err);
      });
    });

    context("with a missing redirect_uri", () => {
      beforeEach(async () => {
        err = new Error("Missing redirect_uri");

        req.session = {
          authParams: undefined,
        };

        await redirectAsErrorToCallback(err, req, res, next);
      });

      it("should not call res.redirect", () => {
        expect(res.redirect).not.to.have.been.called;
      });

      it("should call next with err", () => {
        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Missing redirect_uri")),
        );
      });
    });
  });
});
