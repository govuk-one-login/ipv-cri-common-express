import { describe, it, vi, beforeEach, expect } from "vitest";
import { EventEmitter } from "node:events";
import {
  requestContextMiddleware,
  requestLoggingMiddleware,
} from "../../../src/bootstrap/middleware/request-logging.js";
import * as loggerModule from "../../../src/lib/logger.js";

const buildReq = (headers = {}) => ({
  method: "POST",
  originalUrl: "/authorize?code=secret",
  ip: "127.0.0.1",
  get: (name) => headers[name],
});

const buildRes = (statusCode = 200, headers = {}) =>
  Object.assign(new EventEmitter(), {
    statusCode,
    finished: false,
    headersSent: false,
    writableEnded: false,
    socket: Object.assign(new EventEmitter(), { writable: true }),
    setHeader: vi.fn(),
    getHeader: (name) => headers[name],
  });

const finish = (res) => {
  Object.assign(res, {
    finished: true,
    headersSent: true,
    writableEnded: true,
  });
  res.emit("finish");
};

const abort = (res) => res.socket.emit("close");

describe("request logging", () => {
  let loggerStub;

  beforeEach(() => {
    loggerStub = LOGGER_RESET();
  });

  describe("requestContextMiddleware", () => {
    it("generates a request ID and returns it in the response", () => {
      const req = buildReq();
      const res = buildRes();

      requestContextMiddleware(req, res, vi.fn());

      expect(req.id).toEqual(expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.id);
    });

    it("reuses an incoming x-request-id", () => {
      const req = buildReq({ "x-request-id": "incoming-id" });

      requestContextMiddleware(req, buildRes(), vi.fn());

      expect(req.id).toEqual("incoming-id");
    });

    it("runs the rest of the request with its context", () => {
      vi.spyOn(loggerModule, "runWithRequestContext");
      const req = buildReq();
      const next = vi.fn();

      requestContextMiddleware(req, buildRes(), next);

      expect(loggerModule.runWithRequestContext).toHaveBeenCalledWith(
        req,
        next,
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("requestLoggingMiddleware", () => {
    it("logs the completed request with redacted URLs once the response finishes", () => {
      const res = buildRes(302, { location: "/callback?code=secret" });
      const next = vi.fn();

      requestLoggingMiddleware(buildReq(), res, next);

      expect(next).toHaveBeenCalled();
      expect(loggerStub.info).not.toHaveBeenCalled();

      finish(res);

      expect(loggerStub.info).toHaveBeenCalledWith(
        {
          http: {
            method: "POST",
            path: "/authorize?code=hidden",
            statusCode: 302,
            durationMs: expect.any(Number),
            location: "/callback?code=hidden",
          },
          clientIp: "127.0.0.1",
        },
        "Request completed",
      );
    });

    it.each([
      [200, "info"],
      [302, "info"],
      [403, "warn"],
      [500, "error"],
    ])("logs a %s response at %s", (statusCode, level) => {
      const res = buildRes(statusCode);

      requestLoggingMiddleware(buildReq(), res, vi.fn());
      finish(res);

      expect(loggerStub[level]).toHaveBeenCalledWith(
        expect.anything(),
        "Request completed",
      );
    });

    it("logs a request aborted before the response was sent as a warning", () => {
      const res = buildRes();

      requestLoggingMiddleware(buildReq(), res, vi.fn());
      abort(res);

      expect(loggerStub.warn).toHaveBeenCalledWith(
        {
          http: {
            method: "POST",
            path: "/authorize?code=hidden",
            durationMs: expect.any(Number),
            aborted: true,
          },
          clientIp: "127.0.0.1",
        },
        "Request completed",
      );
    });

    it("keeps the status of a response aborted part way through", () => {
      const res = Object.assign(buildRes(500), { headersSent: true });

      requestLoggingMiddleware(buildReq(), res, vi.fn());
      abort(res);

      expect(loggerStub.error).toHaveBeenCalledWith(
        expect.objectContaining({
          http: expect.objectContaining({ statusCode: 500, aborted: true }),
        }),
        "Request completed",
      );
    });
  });
});
