const publicModule = require(APP_ROOT + "/src/bootstrap/middleware/public");
const publicMiddleware = publicModule.middleware;
const notFoundFallback = publicModule.notFoundFallback;
const express = require("express");

describe("Public static assets", () => {
  let router;

  beforeEach(() => {
    router = {
      use: sinon.stub(),
    };
    sinon.stub(express, "Router").returns(router);
    sinon.stub(express, "static").returns("static middleware");
  });

  afterEach(() => {
    express.Router.restore();
    express.static.restore();
  });

  describe("middleware", () => {
    it("creates and returns a router", () => {
      const router = publicMiddleware();
      express.Router.should.have.been.called;
      router.should.equal(router);
    });

    it("adds default public directories", () => {
      const router = publicMiddleware();

      express.static.should.have.callCount(3);
      router.use.should.have.callCount(3);

      router.use
        .getCall(0)
        .should.have.been.calledWithExactly("/public", "static middleware");
      express.static
        .getCall(0)
        .should.have.been.calledWithExactly(
          APP_ROOT + "/test/bootstrap/fixtures/public",
          { maxAge: 86400000 },
        );

      router.use
        .getCall(1)
        .should.have.been.calledWithExactly(
          "/public/images",
          "static middleware",
        );
      express.static
        .getCall(1)
        .should.have.been.calledWithExactly(
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
    });

    it("adds hmpo-components assets when hmpoComponentsDir is provided", () => {
      const path = require("path");
      const hmpoComponentsDir = path.dirname(
        require.resolve("hmpo-components"),
      );
      publicMiddleware({ hmpoComponentsDir });

      express.static.should.have.callCount(4);
      router.use.should.have.callCount(4);

      router.use
        .getCall(2)
        .should.have.been.calledWithExactly(
          "/public/images",
          "static middleware",
        );
      express.static
        .getCall(2)
        .should.have.been.calledWithExactly(
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
