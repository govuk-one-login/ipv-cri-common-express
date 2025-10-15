const pino = require("pino");
const { logger } = require(APP_ROOT + "/src/bootstrap/lib/logger");

describe("Logger", () => {
  beforeEach(() => {
    sinon.stub(pino, "config");
    sinon.stub(pino, "get").returns("logger instance");
    if (logger.get.restore) logger.get.restore();
  });

  afterEach(() => {
    pino.config.restore();
    pino.get.restore();
    LOGGER_RESET();
  });

  it("exports functions", () => {
    logger.should.be.a("function");
    logger.setup.should.be.a("function");
    logger.get.should.be.a("function");
    logger.get.should.equal(logger);
  });

  describe("setup", () => {
    it("configures logger from options", () => {
      logger.setup({ foo: "bar" });
      pino.config.should.have.been.calledWithExactly({ foo: "bar" });
    });

    it("configures logger from config", () => {
      logger.setup();
      pino.config.should.have.been.calledWithExactly({ console: true });
    });
  });

  describe("get", () => {
    it("returns a named logger", () => {
      logger.get("name");
      pino.get.should.have.been.calledWithExactly("name", 2);
    });

    it("returns a default logger", () => {
      logger.get();
      pino.get.should.have.been.calledWithExactly(":hmpo-app", 2);
    });
  });
});
