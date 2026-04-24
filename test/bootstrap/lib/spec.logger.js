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
    if (hmpoLogger.config.restore) hmpoLogger.config.restore();
    if (hmpoLogger.get.restore) hmpoLogger.get.restore();
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

  describe("logError", () => {
    let mockLogger;

    const mockReq = {
      method: "GET",
      url: "/search?q=test&code=sensitive",
      originalUrl: "/search?q=test&code=sensitive",
      ip: "127.0.0.1",
    };

    const mockErr = () => {
      const err = new Error("Something failed");
      err.code = "FAIL";
      err.name = "TestError";
      err.stack = "stacktrace";
      return err;
    };

    beforeEach(function () {
      sinon.restore();

      process.env.USE_PINO_LOGGER = "true";

      mockLogger = {
        error: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
      };
    });

    afterEach(function () {
      sinon.restore();
      delete process.env.USE_PINO_LOGGER;
      delete process.env.NODE_ENV;
    });

    it("should log structured error in Pino mode", function () {
      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      expect(mockLogger.error.calledOnce).to.equal(true);

      const arg = mockLogger.error.firstCall.args[0];

      expect(arg.code).to.equal("FAIL");
      expect(arg.method).to.equal("GET");
      expect(arg.request).to.equal("/search?q=test&code=hidden");
      expect(arg.message.includes("Something failed")).to.equal(true);
    });

    it("should include prefix in message", function () {
      logger.logError(mockReq, mockErr(), {
        logger: mockLogger,
        messagePrefix: "Added Start",
      });

      const arg = mockLogger.error.firstCall.args[0];

      expect(arg.message.startsWith("Added Start:")).to.equal(true);
    });

    it("should omit code if not present", function () {
      const err = new Error("No code error");

      logger.logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.firstCall.args[0];

      expect(arg.code).to.equal(undefined);
    });

    it("should redact sensitive query params from request", function () {
      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.firstCall.args[0];

      expect(arg.request).to.equal("/search?q=test&code=hidden");
    });

    it("should include stack in non-production", function () {
      process.env.NODE_ENV = "development";

      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.firstCall.args[0];

      expect(arg.err.stack).to.exist;
    });

    it("should call HMPO logger in legacy mode", function () {
      process.env.USE_PINO_LOGGER = "false";

      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      expect(mockLogger.error.calledOnce).to.equal(true);

      const args = mockLogger.error.firstCall.args;

      expect(args[0]).to.equal(":clientip :verb :request :err.message");
      expect(args[1].req).to.exist;
      expect(args[1].err).to.exist;
    });
  });
});
