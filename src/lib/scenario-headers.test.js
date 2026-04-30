const scenarioHeaders = require("./scenario-headers");

describe("scenario-headers", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;
  });

  context("with 'NODE_ENV' as 'development'", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      req.headers["x-scenario-id"] = "scenario-number-1";
      scenarioHeaders(req, res, next);
    });

    it("should set scenarioHeader on req", () => {
      expect(req.scenarioIDHeader).to.equal("scenario-number-1");
    });

    it("should call next", () => {
      expect(next).to.have.been.called;
    });
  });

  context("with 'NODE_ENV' not as 'development'", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      req.headers["x-scenario-id"] = "scenario-number-1";
      scenarioHeaders(req, res, next);
    });

    it("should not set scenarioHeader on req", () => {
      expect(req.scenarioIDHeader).to.be.undefined;
    });

    it("should call next", () => {
      expect(next).to.have.been.called;
    });
  });

  context('with missing "x-scenario-id" header', () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      scenarioHeaders(req, res, next);
    });

    it("should not set scenarioHeader on req", () => {
      expect(req.scenarioIDHeader).to.be.undefined;
    });

    it("should call next", () => {
      expect(next).to.have.been.called;
    });
  });
});
