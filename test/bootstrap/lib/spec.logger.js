import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

import {
  getLogger,
  logError,
  redactQueryParams,
} from "../../../src/bootstrap/lib/logger.js";
import { PACKAGE_NAME } from "../../../src/lib/constants.js";
import pino from "pino";

describe("Logger", () => {
  beforeEach(() => {
    if (vi.isMockFunction(getLogger)) {
      getLogger.mockRestore();
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
        const actual = redactQueryParams(input);

        // Assert
        expect(actual).toEqual(output);
      });
    });
  });

  afterEach(() => {
    LOGGER_RESET();
  });

  it("exports functions", () => {
    expect(typeof getLogger).toBe("function");
    expect(typeof logError).toBe("function");
  });

  describe("getLogger", () => {
    it("creates and returns a pino logger", () => {
      const pinoLogger = getLogger("pino-test");
      expect(pinoLogger).to.have.property("info").that.is.a("function");
    });

    it("caches pino loggers by name", () => {
      const logger1 = getLogger("cached-logger");
      const logger2 = getLogger("cached-logger");
      expect(logger1).to.equal(logger2);
    });

    it("defaults the logger name to the package name", () => {
      expect(getLogger()).to.equal(getLogger(PACKAGE_NAME));
    });

    describe("serializers", () => {
      const getSerializers = () =>
        getLogger("serializer-test")[pino.symbols.serializersSym];

      it("serializes error properties", () => {
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

      it("serializes request meta", () => {
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

      it("serializes response meta", () => {
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

      mockLogger = {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      };
    });

    afterEach(function () {
      vi.restoreAllMocks();
      delete process.env.NODE_ENV;
    });

    it("should log a structured error", function () {
      logError(mockReq, mockErr(), { logger: mockLogger });

      expect(mockLogger.error).toHaveBeenCalledTimes(1);

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.code).toEqual("FAIL");
      expect(arg.method).toEqual("GET");
      expect(arg.request).toEqual("/search?q=test&code=hidden");
      expect(arg.message.includes("Something failed")).toEqual(true);
    });

    it("should include prefix in message", function () {
      logError(mockReq, mockErr(), {
        logger: mockLogger,
        messagePrefix: "Added Start",
      });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.message.startsWith("Added Start:")).toEqual(true);
    });

    it("should include error properties such as status at top level", function () {
      const err = mockErr();
      err.status = 403;

      logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.status).toEqual(403);
      expect(arg.code).toEqual("FAIL");
    });

    it("should include the stack as an array of lines at top level", function () {
      const err = mockErr();
      err.stack = "line one\nline two";

      logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.stack).toEqual(["line one", "line two"]);
    });

    it("should include the original error at top level", function () {
      const err = mockErr();
      err.original = new Error("Root cause");

      logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.original.message).toEqual("Root cause");
    });

    it("should include clientip and sessionID", function () {
      logError({ ...mockReq, sessionID: "session-1" }, mockErr(), {
        logger: mockLogger,
      });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.clientip).toEqual("127.0.0.1");
      expect(arg.sessionID).toEqual("session-1");
    });

    it("should omit code if not present", function () {
      const err = new Error("No code error");

      logError(mockReq, err, { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.code).toBeUndefined();
    });

    it("should redact sensitive query params from request", function () {
      logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.request).toEqual("/search?q=test&code=hidden");
    });

    it("should include stack in non-production", function () {
      process.env.NODE_ENV = "development";

      logError(mockReq, mockErr(), { logger: mockLogger });

      const arg = mockLogger.error.mock.calls[0][0];

      expect(arg.err.stack).to.exist;
    });
  });
});
