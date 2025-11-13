const hmpoLogger = require("hmpo-logger");
const logger = require(APP_ROOT + "/src/bootstrap/lib/logger");

describe("Logger", () => {
  beforeEach(() => {
    sinon.stub(hmpoLogger, "config");
    sinon.stub(hmpoLogger, "get").returns("logger instance");
    if (logger.get.restore) logger.get.restore();
  });

  describe("redactQueryParams", () => {
    [
      {
        input: undefined,
        output: undefined,
      },
      {
        input: "malformed",
        output: "malformed",
      },
      {
        input: "http://example.com/authorize",
        output: "http://example.com/authorize",
      },
      {
        input: "http://example.com/authorize?safe=value",
        output: "http://example.com/authorize?safe=value",
      },
      {
        input:
          "http://example.com/authorize?code=secret_code&safe=value&request=long_request",
        output:
          "http://example.com/authorize?code=hidden&safe=value&request=hidden",
      },
      {
        input: "/authorize?code=secret_code&safe=value&request=long_request",
        output: "/authorize?code=hidden&safe=value&request=hidden",
      },
    ].forEach(({ input, output }) => {
      it(`should correctly map ${input}`, () => {
        // Act
        const actual = logger.redactQueryParams(input);

        // Assert
        expect(actual).to.equal(output);
      });
    });
  });

  afterEach(() => {
    hmpoLogger.config.restore();
    hmpoLogger.get.restore();
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
      hmpoLogger.config.should.have.been.calledWithExactly({ foo: "bar" });
    });

    it("configures logger from config", () => {
      logger.setup();
      hmpoLogger.config.should.have.been.calledWithExactly({ console: true });
    });
  });

  describe("get", () => {
    it("returns a named logger", () => {
      logger.get("name");
      hmpoLogger.get.should.have.been.calledWithExactly("name", 2);
    });

    it("returns a default logger", () => {
      logger.get();
      hmpoLogger.get.should.have.been.calledWithExactly(":hmpo-app", 2);
    });

    it("uses hmpo-logger when USE_PINO_LOGGER is not 'true'", () => {
      const prev = process.env.USE_PINO_LOGGER;
      delete process.env.USE_PINO_LOGGER;

      logger.get("fallback-test");
      hmpoLogger.get.should.have.been.calledWithExactly("fallback-test", 2);

      if (typeof prev !== "undefined") {
        process.env.USE_PINO_LOGGER = prev;
      } else {
        delete process.env.USE_PINO_LOGGER;
      }
    });
  });

  describe("when USE_PINO_LOGGER is 'true'", () => {
    beforeEach(() => {
      process.env.USE_PINO_LOGGER = "true";
    });

    afterEach(() => {
      delete process.env.USE_PINO_LOGGER;
    });

    it("creates and returns a pino logger", () => {
      const pinoLogger = logger.get("pino-test");
      expect(pinoLogger).to.have.property("info").that.is.a("function");
    });

    it("caches pino loggers by name", () => {
      const logger1 = logger.get("cached-logger");
      const logger2 = logger.get("cached-logger");
      expect(logger1).to.equal(logger2);
    });
  });
});
