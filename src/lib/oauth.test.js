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

  describe("buildRedirectUrl", () => {
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

    it("should use the redirect_uri if valid", () => {
      authParams = {
        redirect_uri: "http://example.org",
      };

      buildRedirectUrl({ authParams });
    });

    context("with an authorization_code", () => {
      beforeEach(() => {
        authParams = {
          redirect_uri: "http://example.org",
          authorization_code: "1234",
          state: "STATE",
          client_id: "client",
        };
      });

      it("should add authorization_code", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("code")).to.equal(
          authParams.authorization_code,
        );
      });
      it("should add client_id", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("client_id")).to.equal(
          authParams.client_id,
        );
      });
      it("should add state if available", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("state")).to.equal(
          authParams.state,
        );
      });

      it("should not add state if not available", () => {
        delete authParams.state;

        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("state")).to.be.null;
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
            error.description,
          );
        });
        it("should add the error message as a fallback", () => {
          delete error.description;
          redirectUrl = buildRedirectUrl({ authParams });

          expect(redirectUrl.searchParams.get("error_description")).to.equal(
            error.message,
          );
        });
        it("should add state if available", () => {
          redirectUrl = buildRedirectUrl({
            authParams: { state: "state-prop", ...authParams },
          });

          expect(redirectUrl.searchParams.get("state")).to.equal("state-prop");
        });
        it("should not add state if not available", () => {
          redirectUrl = buildRedirectUrl({ authParams });

          expect(redirectUrl.searchParams.get("state")).to.be.null;
        });
      });
      describe("without an error object", () => {});
    });
  });
});
