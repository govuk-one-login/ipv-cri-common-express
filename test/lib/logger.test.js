import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

import {
  getLogger,
  getRequestContext,
  logError,
  runWithRequestContext,
  serialiseError,
  redactQueryParams,
} from "../../src/lib/logger.js";
import { PACKAGE_NAME } from "../../src/lib/constants.js";
import { CustomFetchHttpError } from "../../src/lib/custom-fetch.js";
import pino from "pino";

describe("Logger", () => {
  beforeEach(() => {
    if (vi.isMockFunction(getLogger)) {
      getLogger.mockRestore();
    }
  });

  afterEach(() => {
    LOGGER_RESET();
  });

  describe("redactQueryParams", () => {
    it.each([
      [undefined, undefined],
      ["malformed", "malformed"],
      ["http://example.com/authorize", "http://example.com/authorize"],
      [
        "http://example.com/authorize?safe=value",
        "http://example.com/authorize?safe=value",
      ],
      [
        "http://example.com/authorize?code=secret_code&safe=value&request=long_request",
        "http://example.com/authorize?code=hidden&safe=value&request=hidden",
      ],
      [
        "/authorize?code=secret_code&safe=value&request=long_request",
        "/authorize?code=hidden&safe=value&request=hidden",
      ],
    ])("maps %s to %s", (input, output) => {
      expect(redactQueryParams(input)).toEqual(output);
    });
  });

  describe("getLogger", () => {
    it("caches pino loggers by name", () => {
      const logger1 = getLogger("cached-logger");
      const logger2 = getLogger("cached-logger");
      expect(logger1).to.equal(logger2);
    });

    it("defaults the logger name to the package name", () => {
      expect(getLogger()).to.equal(getLogger(PACKAGE_NAME));
    });

    it("configures the log format", () => {
      const logger = getLogger("format-test");

      expect(logger[pino.symbols.messageKeySym]).toEqual("message");
      expect(logger[pino.symbols.errorKeySym]).toEqual("error");
      expect(logger[pino.symbols.timeSym]).toBe(pino.stdTimeFunctions.isoTime);
    });

    describe("request context mixin", () => {
      const getMixin = () => getLogger("mixin-test")[pino.symbols.mixinSym];
      const req = {
        id: "request-1",
        session: { id: "session-1", govuk_signin_journey_id: "journey-1" },
      };

      it("adds the request context to lines logged while handling a request", async () => {
        const context = await runWithRequestContext(req, async () => {
          await Promise.resolve();
          return getMixin()();
        });

        expect(context).toEqual(
          expect.objectContaining({
            requestId: "request-1",
            sessionId: "session-1",
            govukSigninJourneyId: "journey-1",
          }),
        );
      });
    });

    describe("serializers", () => {
      const getSerializers = () =>
        getLogger("serializer-test")[pino.symbols.serializersSym];

      it.each(["error", "err"])("serialises errors logged under %s", (key) => {
        const err = new Error("Something failed");
        err.code = "FAIL";
        err.status = 403;

        expect(getSerializers()[key](err)).toEqual(
          expect.objectContaining({
            name: "Error",
            code: "FAIL",
            status: 403,
            message: "Something failed",
            stack: expect.any(Array),
          }),
        );
      });

      it("passes through values that are not errors", () => {
        expect(getSerializers().error({ code: "x" })).toEqual({ code: "x" });
      });
    });
  });

  describe("serialiseError", () => {
    it("only includes allowlisted fields", () => {
      const err = new Error("Response not OK");
      err.code = 500;
      err.body = '{"name":"Scrooge McDuck"}';
      err.headers = new Headers();

      expect(Object.keys(serialiseError(err))).toEqual([
        "name",
        "code",
        "status",
        "message",
        "stack",
        "cause",
      ]);
    });

    it("splits the stack into lines", () => {
      const err = new Error("failed");
      err.stack = "line one\nline two";

      expect(serialiseError(err).stack).toEqual(["line one", "line two"]);
    });

    it("summarises the cause", () => {
      const cause = Object.assign(
        new Error("getaddrinfo ENOTFOUND api.gov.uk", {
          cause: new Error("deeper"),
        }),
        { code: "ENOTFOUND", body: "not logged" },
      );

      expect(
        serialiseError(new TypeError("fetch failed", { cause })).cause,
      ).toEqual({
        name: "Error",
        code: "ENOTFOUND",
        message: "getaddrinfo ENOTFOUND api.gov.uk",
      });
    });

    it("returns undefined for values that are not objects", () => {
      expect(serialiseError("failed")).toBeUndefined();
    });
  });

  describe("getRequestContext", () => {
    it("returns correlation IDs from the request and session", () => {
      expect(
        getRequestContext({
          id: "request-1",
          session: {
            id: "session-1",
            ipvSessionId: "ipv-session-1",
            govuk_signin_journey_id: "journey-1",
            context: "some-context",
          },
        }),
      ).toEqual({
        requestId: "request-1",
        sessionId: "session-1",
        ipvSessionId: "ipv-session-1",
        govukSigninJourneyId: "journey-1",
        context: "some-context",
      });
    });

    it("handles a request without a session", () => {
      expect(getRequestContext({})).toEqual({
        requestId: undefined,
        sessionId: undefined,
        ipvSessionId: undefined,
        govukSigninJourneyId: undefined,
        context: undefined,
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
      mockLogger = LOGGER_RESET();
    });

    it("should log an unexpected error with its stack", function () {
      const err = mockErr();
      err.stack = "line one\nline two";

      logError(mockReq, err);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            name: "TestError",
            code: "FAIL",
            message: "Something failed",
            stack: ["line one", "line two"],
          }),
          http: { method: "GET", path: "/search?q=test&code=hidden" },
        }),
        "Request error",
      );
    });

    it("should log a client error at info without its stack", function () {
      const err = mockErr();
      err.status = 403;

      logError(mockReq, err);

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      const [arg] = mockLogger.info.mock.calls[0];
      expect(arg.error.status).toEqual(403);
      expect(arg.error.stack).toBeUndefined();
    });

    it("should log an upstream API 4xx as an unexpected error", function () {
      const err = new CustomFetchHttpError(
        { status: 400, statusText: "Bad Request", headers: new Headers() },
        "",
      );

      logError(mockReq, err);

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      const [arg] = mockLogger.error.mock.calls[0];
      expect(arg.error.code).toEqual(400);
      expect(arg.error.stack).toBeDefined();
    });

    it("should use the given message and fields", function () {
      logError(mockReq, mockErr(), {
        message: "Error after response",
        fields: { extra: "value" },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ extra: "value" }),
        "Error after response",
      );
    });
  });
});
