const publicModule = require(APP_ROOT + "/src/bootstrap/middleware/public");
const publicMiddleware = publicModule.middleware;
const notFoundFallback = publicModule.notFoundFallback;
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";

const publicMiddleware = require(
  APP_ROOT + "/src/bootstrap/middleware/public",
).middleware;
const express = require("express");

describe("Public static assets", () => {
  let router;

  beforeEach(() => {
    router = {
      use: vi.fn(),
    };
    vi.spyOn(express, "Router").mockReturnValue(router);
    vi.spyOn(express, "static").mockReturnValue("static middleware");
  });

  afterEach(() => {
    express.Router.mockRestore();
    express.static.mockRestore();
  });

  describe("middleware", () => {
    it("creates and returns a router", () => {
      const router = publicMiddleware();
      expect(express.Router).toHaveBeenCalled();
      expect(router).toEqual(router);
    });

    it("adds default public directories", () => {
      const router = publicMiddleware();

      express.static.should.have.callCount(3);
      router.use.should.have.callCount(3);
      expect(express.static).toHaveBeenCalledTimes(3);
      expect(router.use).toHaveBeenCalledTimes(5);

      expect(router.use).toHaveBeenNthCalledWith(
        1,
        "/public",
        "static middleware",
      );

      expect(express.static).toHaveBeenNthCalledWith(
        1,
        APP_ROOT + "/test/bootstrap/fixtures/public",
        { maxAge: 86400000 },
      );

      expect(router.use).toHaveBeenNthCalledWith(
        2,
        "/public/images",
        "static middleware",
      );
      expect(express.static).toHaveBeenNthCalledWith(
        2,
        APP_ROOT + "/test/bootstrap/fixtures/assets/images",
        { maxAge: 86400000 },
      );

      router.use
        .getCall(2)
        .should.have.been.calledWithExactly("/public", "static middleware");
      express.static
        .getCall(2)
        .should.have.been.calledWithExactly(
          APP_ROOT + "/node_modules/govuk-frontend/dist/govuk/assets",
          { maxAge: 86400000 },
        );
      expect(router.use).toHaveBeenNthCalledWith(
        3,
        "/public",
        "static middleware",
      );
      expect(express.static).toHaveBeenNthCalledWith(
        3,
        APP_ROOT + "/node_modules/govuk-frontend/dist/govuk/assets",
        { maxAge: 86400000 },
      );

      expect(router.use).toHaveBeenNthCalledWith(
        4,
        "/public",
        expect.any(Function),
      );
      expect(router.use).toHaveBeenNthCalledWith(
        5,
        "/public/images",
        expect.any(Function),
      );
    });

    it("adds hmpo-components assets when hmpoComponentsDir is provided", () => {
      const path = require("path");
      const hmpoComponentsDir = path.dirname(
        require.resolve("hmpo-components"),
      );
      publicMiddleware({ hmpoComponentsDir });

      express.static.should.have.callCount(4);
      router.use.should.have.callCount(4);
      expect(express.static).toHaveBeenCalledTimes(4);
      expect(router.use).toHaveBeenCalledTimes(6);

      expect(router.use).toHaveBeenNthCalledWith(
        3,
        "/public/images",
        "static middleware",
      );
      expect(express.static).toHaveBeenNthCalledWith(
        3,
        hmpoComponentsDir + "/assets/images",
        { maxAge: 86400000 },
      );
    });
  });

  describe("notFoundFallback", () => {
    it("registers handlers on the public and public images paths", () => {
      notFoundFallback({
        urls: { public: "/public", publicImages: "/public/images" },
      });

      router.use.should.have.callCount(2);
      router.use
        .getCall(0)
        .should.have.been.calledWith("/public", sinon.match.func);
      router.use
        .getCall(1)
        .should.have.been.calledWith("/public/images", sinon.match.func);
    });

    it("responds with 404 for unmatched requests", () => {
      notFoundFallback({
        urls: { public: "/public", publicImages: "/public/images" },
      });

      const [, handler] = router.use.getCall(0).args;
      const req = { url: "/i-dont-exist" };
      const res = { sendStatus: sinon.stub() };
      handler(req, res);

      res.sendStatus.should.have.been.calledWithExactly(404);
    });
  });
});
