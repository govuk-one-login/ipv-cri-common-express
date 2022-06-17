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

    oAuthStub.buildRedirectUrl = sinon.fake();
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
          })
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
          })
        );
      });

      it("should override redirect_uri if provided in response body", async () => {
        await redirectAsErrorToCallback(err, req, res, next);

        expect(oAuthStub.buildRedirectUrl).to.have.been.calledWith(
          sinon.match({
            authParams: {
              redirect_uri: "http://error.example.org",
            },
          })
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
          })
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
          })
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
          })
        );
      });
    });

    context.skip("with default Error object", () => {
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
      it("should call res.redirect with url");
      it("should not call next");
    });

    context("with invalid redirect url", () => {
      it("should not call res.redirect");
      it("should call next with err");
    });
  });
});
