const pino = require("pino");
const logger = require(APP_ROOT + "/src/bootstrap/lib/logger");

describe("Logger", () => {
  beforeEach(() => {
    pino.config = sinon.stub();
    pino.get = sinon.stub().returns("logger instance");
    if (logger.get && logger.get.restore) logger.get.restore();
  });

  afterEach(() => {
    delete pino.config;
    delete pino.get;
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
      const a = logger.get("name");
      const b = logger.get("name");
      a.should.equal(b);
    });

    it("returns a default logger", () => {
      const def = logger.get();
      def.should.exist;
    });
  });
});
