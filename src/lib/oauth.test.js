import { describe, it, expect, beforeEach } from "vitest";

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

      expect(authParams.redirect_uri).toEqual(data.redirect_uri);
    });

    it("should save 'state' to sessionModel", () => {
      data.state = "http://example.net";

      addOAuthPropertiesToSession({ authParams, data });

      expect(authParams.state).toEqual(data.state);
    });

    describe("with authorization_code", () => {
      it("should save 'authorization_code' to sessionModel", () => {
        data.code = "C0DE";

        addOAuthPropertiesToSession({ authParams, data });

        expect(authParams.authorization_code).toEqual(data.code);
      });
    });

    describe("without authorization_code", () => {
      it("should save 'error' to sessionModel", () => {
        addOAuthPropertiesToSession({ authParams, data });

        expect(authParams.error).toEqual({
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

      const result = buildRedirectUrl({ authParams });
      expect(result).toBeInstanceOf(URL);
      expect(result.origin).toBe("http://example.org");
    });

    describe("with an authorization_code", () => {
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

        expect(redirectUrl.searchParams.get("code")).toEqual(
          authParams.authorization_code,
        );
      });
      it("should add client_id", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("client_id")).toEqual(
          authParams.client_id,
        );
      });
      it("should add state if available", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("state")).toEqual(authParams.state);
      });

      it("should not add state if not available", () => {
        delete authParams.state;

        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("state")).toBeNull();
      });
    });

    describe("without an authorization_code with an error object", () => {
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

        expect(redirectUrl.searchParams.get("error")).toEqual(error.code);
      });
      it("should add the error description if available", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("error_description")).toEqual(
          error.description,
        );
      });
      it("should add the error message as a fallback", () => {
        delete error.description;
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("error_description")).toEqual(
          error.message,
        );
      });
      it("should add state if available", () => {
        redirectUrl = buildRedirectUrl({
          authParams: { state: "state-prop", ...authParams },
        });

        expect(redirectUrl.searchParams.get("state")).toEqual("state-prop");
      });
      it("should not add state if not available", () => {
        redirectUrl = buildRedirectUrl({ authParams });

        expect(redirectUrl.searchParams.get("state")).toBeNull();
      });
    });
  });
});
