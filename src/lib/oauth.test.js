const { addOAuthPropertiesToSession, buildRedirectUrl } = require("./oauth");

describe("oauth lib", () => {
  describe("addOAuthPropertiesToSession", () => {
    let authParams;
    let data;

    beforeEach(() => {
      authParams = {};
      data = {};
    });

    it("should save 'redirect_uri' to sessionModel", () => {
      data.redirect_uri = "http://example.net";

      addOAuthPropertiesToSession({ authParams, data });

      expect(authParams.redirect_uri).to.equal(data.redirect_uri);
    });

    it("should save 'state' to sessionModel", () => {
      data.state = "http://example.net";

      addOAuthPropertiesToSession({ authParams, data });

      expect(authParams.state).to.equal(data.state);
    });

    describe("with authorization_code", () => {
      it("should save 'authorization_code' to sessionModel", () => {
        data.code = "C0DE";

        addOAuthPropertiesToSession({ authParams, data });

        expect(authParams.authorization_code).to.equal(data.code);
      });
    });

    describe("without authorization_code", () => {
      it("should save 'error' to sessionModel", () => {
        addOAuthPropertiesToSession({ authParams, data });

        expect(authParams.error).to.deep.equal({
          code: "server_error",
          error_description: "Failed to retrieve authorization code",
        });
      });
    });
  });

  describe.only("buildRedirectUrl", () => {
    let authParams;
    let redirectUrl;

    it("should throw an error if redirect_uri is not valid", () => {
      authParams = {
        redirect_uri: "not-a-valid-url",
      };

      expect(() => buildRedirectUrl({ authParams }))
        .to.throw(TypeError)
        .with.property("code", "ERR_INVALID_URL");
    });

    it.skip("should use the redirect_uri if valid", () => {
      authParams = {
        redirect_uri: "http://example.org",
      };

      buildRedirectUrl({ authParams });
    });

    context.only("with an authCode and valid redirect_uri", () => {
      beforeEach(() => {
        authParams = {
          redirect_uri: "http://example.org",
          state: "state",
          client_id: "1",
          authorization_code: "ABADCAFE",
          error: {
            code: "err01",
            description: "description",
          },
        };
      });

      it("should build a url with client_id, state and code", () => {
        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "?client_id=1&state=undefined&code=ABADCAFE"
        );
      });
      it("should build a url with missing client_id");
      it("should build a url with missing state");
      it("should build a url with missing code");
    });

    context.only("with an error and valid redirect_uri", () => {
      let authParams;

      beforeEach(() => {
        authParams = {
          redirect_uri: "http://example.org",
          state: "state",
          error: {
            code: "err01",
            description: "description",
          },
        };
      });
      it("should build a url with error, error_description and state", () => {
        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "http://example.org/?error=err01&error_description=description&state=state"
        );
      });
      it("should build a url with missing error code", () => {
        delete authParams.error.code;
        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "http://example.org/?error=err01&error_description=description&state=state"
        );
      });
      it("should build a url with error message", () => {
        delete authParams.error.description;
        authParams.error.message = "message";

        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "http://example.org/?error=err01&error_description=description&state=state"
        );
      });
      it("should build a url with missing error_description", () => {
        delete authParams.error.description;

        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "http://example.org/?error=err01&error_description=description&state=state"
        );
      });

      it("should build a url with missing state", () => {
        delete authParams.state;

        const url = buildRedirectUrl({ authParams });

        expect(url.toString()).to.equal(
          "http://example.org/?error=err01&error_description=description"
        );
      });
    });

    context("without an authCode an error", () => {
      it("should build a url with error, error_description and state", () => {
        const url = buildRedirectUrl({
          redirect_uri: "http://example.org",
          error: {
            code: "err01",
            error_description: "description",
            state: "state",
          },
        });

        expect(url).to.be("http://example.org");
      });
      it("should build a url with missing error", () => {
        const url = buildRedirectUrl({
          redirect_uri: "http://example.org",
          error: {
            error_description: "description",
            state: "state",
          },
        });

        expect(url).to.be("http://example.org");
      });
      it("should build a url with missing error_description", () => {
        const url = buildRedirectUrl({
          redirect_uri: "http://example.org",
          error: {
            code: "err01",
            state: "state",
          },
        });

        expect(url).to.be("http://example.org");
      });
      it("should build a url with missing state", () => {
        const url = buildRedirectUrl({
          redirect_uri: "http://example.org",
          error: {
            code: "err01",
            error_description: "description",
          },
        });

        expect(url).to.be("http://example.org");
      });
    });

    context("with an authorization_code", () => {
      beforeEach(() => {
        authParams = {
          redirect_uri: "http://example.org",
          authorization_code: "1234",
          state: "STATE",
          client_id: "client",
        };

        redirectUrl = buildRedirectUrl({ authParams });
      });

      it("should add authorization_code", () => {
        expect(redirectUrl.searchParams.get("code")).to.equal(
          authParams.authorization_code
        );
      });
      it("should add client_id", () => {
        expect(redirectUrl.searchParams.get("client_id")).to.equal(
          authParams.client_id
        );
      });
      it("should add state", () => {
        expect(redirectUrl.searchParams.get("state")).to.equal(
          authParams.state
        );
      });
    });
    context("without an authorization_code", () => {
      describe("with an error object", () => {
        let error;
        beforeEach(() => {
          error = {
            code: "E_ERROR",
            message: "Error Message",
            description: "Error Description",
          };

          authParams = {
            redirect_uri: "http://example.org",
            error,
          };
        });

        it("should add the error code", () => {
          redirectUrl = buildRedirectUrl({ authParams });

          expect(redirectUrl.searchParams.get("error")).to.equal(error.code);
        });
        it("should add the error description if available", () => {
          redirectUrl = buildRedirectUrl({ authParams });

          expect(redirectUrl.searchParams.get("error_description")).to.equal(
            error.description
          );
        });
        it("should add the error message as a fallback", () => {
          delete error.description;
          redirectUrl = buildRedirectUrl({ authParams });

          expect(redirectUrl.searchParams.get("error_description")).to.equal(
            error.message
          );
        });
      });
      describe("without an error object", () => {});
    });
  });
});
