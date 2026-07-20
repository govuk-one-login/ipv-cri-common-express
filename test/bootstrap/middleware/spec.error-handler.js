import { describe, it, expect, beforeEach, vi } from "vitest";

const loggerModule = require("../../../src/bootstrap/lib/logger");
const request = require("hmpo-reqres").req;

describe("Error Handler", () => {
  let req, res, next, errorhandler, middleware;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = request({
      baseUrl: "/my-app",
      path: "/my-app/path",
      method: "GET",
    });
    res = {
      render: vi.fn(),
      redirect: vi.fn(),
      locals: {
        backLink: "/back",
      },
    };
    next = vi.fn();

    vi.spyOn(loggerModule, "logError");

    middleware = require(
      APP_ROOT + "/src/bootstrap/middleware/error-handler",
    ).middleware;

    errorhandler = middleware({
      startUrl: "/start",
    });
  });

  describe("middleware", () => {
    it("exports a function with length 4 - express identifies error handling middleware by its arguments length", () => {
      expect(typeof errorhandler).toBe("function");
      expect(errorhandler).toHaveLength(4);
    });

    describe("redirects", () => {
      it("redirect instead of showing error page if redirect is present in error", () => {
        const err = { redirect: "/redirect/location" };
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/redirect/location");
      });

      it("does not redirect if path matches the redirect", () => {
        req.path = "location///";
        const err = { redirect: "location" };
        errorhandler(err, req, res, next);
        expect(res.redirect).not.toHaveBeenCalled();
      });

      it("does redirect if on the POST of destination page", () => {
        req.path = "/redirect/location";
        req.method = "POST";
        const err = { redirect: "/redirect/location" };
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/redirect/location");
      });

      it("does not redirect if on a GET of the destination page", () => {
        req.path = "/redirect/location";
        const err = { redirect: "/redirect/location" };
        errorhandler(err, req, res, next);
        expect(res.redirect).not.toHaveBeenCalled();
      });
    });

    describe("Back links", () => {
      let err;

      beforeEach(() => {
        err = {};
      });

      it("does not include a back link for SESSION_TIMEOUT errors", () => {
        err.code = "SESSION_TIMEOUT";
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "errors/session-ended",
          expect.objectContaining({ backLink: null }),
        );
      });

      it("sets req.path as the back link for POSTs", () => {
        req.path = "/foo";
        req.method = "POST";
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "errors/error",
          expect.objectContaining({ backLink: "/foo" }),
        );
      });

      it("sets res.locals.backLink as the back link for GETs", () => {
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "errors/error",
          expect.objectContaining({ backLink: "/back" }),
        );
      });
    });

    describe("Session timeout error", () => {
      let err;

      beforeEach(() => {
        err = {
          code: "SESSION_TIMEOUT",
        };
        req.path = "/payment";
        req.method = "GET";
      });

      it("sets a default template and clears backlink", () => {
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "errors/session-ended",
          expect.objectContaining({ backLink: null }),
        );
      });

      it("doesn't overwrite a custom timeout template", () => {
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "test/template",
          expect.objectContaining({ backLink: null }),
        );
      });

      it("redirects to the base page if this is a new browser", () => {
        req.isNewBrowser = true;
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/start");
        expect(res.render).not.toHaveBeenCalled();
      });

      it("redirects to a start page specified by a startUrl function", () => {
        req.isNewBrowser = true;
        res.locals = { htmlLang: "cy" };
        errorhandler = middleware({
          startUrl: (err, req, res) =>
            res.locals.htmlLang === "cy" ? "/welsh" : "/english",
        });
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/welsh");
        expect(res.render).not.toHaveBeenCalled();
      });

      it("redirects to / if no startUrl is specified", () => {
        req.isNewBrowser = true;
        errorhandler = middleware();
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledWith("/");
      });

      it("doesn't redirect to the base page if a custom template is given", () => {
        req.isNewBrowser = true;
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(res.redirect).not.toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "test/template",
          expect.objectContaining({ backLink: null }),
        );
      });

      it("sets the status code to 403", () => {
        errorhandler(err, req, res, next);
        expect(res.statusCode).toEqual(403);
      });
    });

    describe("Missing prereq error", () => {
      let err;

      beforeEach(() => {
        err = {
          code: "MISSING_PREREQ",
        };
      });

      it("redirects to the start page if the error contains no redirect location", () => {
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/start");
        expect(res.render).not.toHaveBeenCalled();
      });

      it("redirects to a specific location if given", () => {
        err.redirect = "/redirect/step";
        errorhandler(err, req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/redirect/step");
        expect(res.render).not.toHaveBeenCalled();
      });

      it("shows error template if a custom template is given and no redirect location is specified", () => {
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(res.redirect).not.toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "test/template",
          expect.objectContaining({
            error: expect.objectContaining({
              code: "MISSING_PREREQ",
            }),
          }),
        );
      });

      it("sets the status code to 403", () => {
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(res.statusCode).toEqual(403);
      });
    });

    describe("Generic error handling", () => {
      let err;

      beforeEach(() => {
        err = {};
      });

      it("should set status code to 403 for MISSING_AUTHPARAMS error", () => {
        err = { code: "MISSING_AUTHPARAMS" };
        errorhandler(err, req, res, next);
        expect(res.statusCode).toEqual(403);
      });

      it("sets a default template if no template is specified", () => {
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "errors/error",
          expect.objectContaining({ backLink: "/back" }),
        );
      });

      it("doesn't overwrite a custom template", () => {
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(res.render).toHaveBeenCalledTimes(1);
        expect(res.render).toHaveBeenCalledWith(
          "test/template",
          expect.objectContaining({ backLink: "/back" }),
        );
      });

      it("should log the error if no template is specified", () => {
        errorhandler(err, req, res, next);
        expect(loggerModule.logError).toHaveBeenCalledTimes(1);
        expect(loggerModule.logError).toHaveBeenCalledWith(req, err);
      });

      it("should not log the error if a template is specified", () => {
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(loggerModule.logError).not.toHaveBeenCalled();
      });

      it("should only log the error if the header has been sent", () => {
        res._headerSent = true;
        err.template = "test/template";
        errorhandler(err, req, res, next);
        expect(loggerModule.logError).toHaveBeenCalledTimes(1);
        expect(loggerModule.logError).toHaveBeenCalledWith(req, err, {
          messagePrefix: "Error after response",
        });
        expect(res.render).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
