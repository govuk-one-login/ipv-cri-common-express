import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

const hmpoLogger = require("hmpo-logger");
const logger = require(APP_ROOT + "/src/bootstrap/lib/logger");

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(hmpoLogger, "config");
    vi.spyOn(hmpoLogger, "get").mockReturnValue("logger instance");
    if (vi.isMockFunction(logger.get)) {
      logger.get.mockRestore();
    }
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
        expect(actual).toEqual(output);
      });
    });
  });

  afterEach(() => {
    if (hmpoLogger.config.restore) hmpoLogger.config.restore();
    if (hmpoLogger.get.restore) hmpoLogger.get.restore();
    LOGGER_RESET();
  });

  it("exports functions", () => {
    expect(typeof logger).toBe("function");
    expect(typeof logger.setup).toBe("function");
    expect(typeof logger.get).toBe("function");
    expect(logger.get).toEqual(logger);
  });

  describe("setup", () => {
    it("configures logger from options", () => {
      logger.setup({ foo: "bar" });
      expect(hmpoLogger.config).toHaveBeenCalledWith({ foo: "bar" });
    });

    it("configures logger from config", () => {
      logger.setup();
      expect(hmpoLogger.config).toHaveBeenCalledWith({ console: true });
    });
  });

  describe("get", () => {
    it("returns a named logger", () => {
      logger.get("name");
      expect(hmpoLogger.get).toHaveBeenCalledWith("name", 2);
    });

    it("returns a default logger", () => {
      logger.get();
      expect(hmpoLogger.get).toHaveBeenCalledWith(":hmpo-app", 2);
    });

    it("uses hmpo-logger when USE_PINO_LOGGER is not 'true'", () => {
      const prev = process.env.USE_PINO_LOGGER;
      delete process.env.USE_PINO_LOGGER;

      logger.get("fallback-test");
      expect(hmpoLogger.get).toHaveBeenCalledWith("fallback-test", 2);

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

    describe("serializers", () => {
      const pino = require("pino");

      const getSerializers = () =>
        logger.get("serializer-test")[pino.symbols.serializersSym];

      it("serializes error properties for hmpo-logger parity", () => {
        const err = new Error("Something failed");
        err.code = "FAIL";
        err.status = 403;

        const serialized = getSerializers().err(err);

        expect(serialized.type).toEqual("Error");
        expect(serialized.message).toEqual("Something failed");
        expect(typeof serialized.stack).toBe("string");
        expect(serialized.code).toEqual("FAIL");
        expect(serialized.status).toEqual(403);
      });

      it("serializes the original error when present", () => {
        const original = new Error("Root cause");
        original.code = "ROOT";
        const err = new Error("Something failed");
        err.original = original;

        const serialized = getSerializers().err(err);

        expect(serialized.original.message).toEqual("Root cause");
        expect(serialized.original.code).toEqual("ROOT");
        expect(typeof serialized.original.stack).toBe("string");
      });

      it("serializes request meta for hmpo-logger parity", () => {
        const serialized = getSerializers().req({
          method: "GET",
          url: "/test?code=secret",
          ip: "127.0.0.1",
          connection: { remoteAddress: "10.0.0.1" },
          hostname: "example.com",
          httpVersionMajor: 1,
          httpVersionMinor: 1,
          headers: { "x-uniq-id": "uniq-123" },
        });

        expect(serialized).toEqual({
          method: "GET",
          url: "/test?code=hidden",
          clientip: "127.0.0.1",
          remoteAddress: "10.0.0.1",
          hostname: "example.com",
          httpversion: "1.1",
          uniqueID: "uniq-123",
        });
      });

      it("serializes response meta for hmpo-logger parity", () => {
        const headers = {
          location: "/done?code=secret",
          "content-length": 1234,
        };
        const serialized = getSerializers().res({
          statusCode: 302,
          locals: { sessionId: "session-1" },
          getHeader: (name) => headers[name],
        });

        expect(serialized).toEqual({
          statusCode: 302,
          sessionId: "session-1",
          location: "/done?code=hidden",
          bytes: 1234,
        });
      });
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
      vi.restoreAllMocks();

      process.env.USE_PINO_LOGGER = "true";

      mockLogger = {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      };
    });

    afterEach(function () {
      vi.restoreAllMocks();
      delete process.env.USE_PINO_LOGGER;
      delete process.env.NODE_ENV;
    });

    it("should log structured error in Pino mode", function () {
      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      expect(mockLogger.error).toHaveBeenCalledTimes(1);

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.code).toEqual("FAIL");
      expect(arg.method).toEqual("GET");
      expect(arg.request).toEqual("/search?q=test&code=hidden");
      expect(arg.message.includes("Something failed")).toEqual(true);
    });

    it("should include prefix in message", function () {
      logger.logError(mockReq, mockErr(), {
        logger: mockLogger,
        messagePrefix: "Added Start",
      });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.message.startsWith("Added Start:")).toEqual(true);
    });

    it("should include error properties such as status at top level", function () {
      const err = mockErr();
      err.status = 403;

      logger.logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.status).toEqual(403);
      expect(arg.code).toEqual("FAIL");
    });

    it("should include the stack as an array of lines at top level", function () {
      const err = mockErr();
      err.stack = "line one\nline two";

      logger.logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.stack).toEqual(["line one", "line two"]);
    });

    it("should include the original error at top level", function () {
      const err = mockErr();
      err.original = new Error("Root cause");

      logger.logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.original.message).toEqual("Root cause");
    });

    it("should include clientip and sessionID", function () {
      logger.logError({ ...mockReq, sessionID: "session-1" }, mockErr(), {
        logger: mockLogger,
      });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.clientip).toEqual("127.0.0.1");
      expect(arg.sessionID).toEqual("session-1");
    });

    it("should omit code if not present", function () {
      const err = new Error("No code error");

      logger.logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.code).toEqual(undefined);
    });

    it("should redact sensitive query params from request", function () {
      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.request).toEqual("/search?q=test&code=hidden");
    });

    it("should include stack in non-production", function () {
      process.env.NODE_ENV = "development";

      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.err.stack).to.exist;
    });

    it("should call HMPO logger in legacy mode", function () {
      process.env.USE_PINO_LOGGER = "false";

      logger.logError(mockReq, mockErr(), { logger: mockLogger });

      expect(mockLogger.error).toHaveBeenCalledTimes(1);

      const args = mockLogger.error.mock.calls[0];

      expect(args[0]).toEqual(":clientip :verb :request :err.message");
      expect(args[1].req).toBeDefined();
      expect(args[1].err).toBeDefined();
    });
  });
});
