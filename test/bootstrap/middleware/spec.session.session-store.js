import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";

const proxyquire = require("proxyquire");
const expressSession = vi.fn();
const session = proxyquire(APP_ROOT + "/src/bootstrap/middleware/session", {
  "express-session": expressSession,
});
const redisClient = require(APP_ROOT + "/src/bootstrap/lib/redis-client");

describe("Session", () => {
  let redisStub;

  beforeEach(() => {
    redisStub = {
      on: vi.fn(),
    };
    vi.spyOn(redisClient, "getClient").mockReturnValue(redisStub);
    expressSession.mockReset();
  });

  afterEach(() => {
    redisClient.getClient.mockRestore();
  });

  it("exports an object of middleware", () => {
    expect(typeof session).toBe("object");
  });

  describe("session middleware", () => {
    describe("session store", () => {
      let sessionStore;
      beforeEach(() => {
        sessionStore = {
          on: vi.fn(),
        };
      });

      it("should be set with default properties", () => {
        session.middleware({ sessionStore });

        expect(expressSession).toHaveBeenCalledWith({
          store: sessionStore,
          cookie: { secure: "auto" },
          key: "hmpo.sid",
          secret: "not-secret",
          resave: true,
          saveUninitialized: true,
        });
      });

      it("should allow override of cookie key", () => {
        session.middleware({ cookieName: "cookie-name", sessionStore });

        expect(expressSession).toHaveBeenCalledWith(
          expect.objectContaining({
            key: "cookie-name",
          }),
        );
      });

      it("should allow override of secret", () => {
        session.middleware({ secret: "very-secret", sessionStore });

        expect(expressSession).toHaveBeenCalledWith(
          expect.objectContaining({
            secret: "very-secret",
          }),
        );
      });

      describe("with cookieOptions", () => {
        let cookieOptions;

        it("should add additional properties", () => {
          cookieOptions = {
            domain: ".example.com",
          };

          session.middleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: expect.objectContaining({ domain: ".example.com" }),
            }),
          );
        });

        it("should allow override of existing options", () => {
          cookieOptions = {
            secure: "false",
          };

          session.middleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: { secure: "false" },
            }),
          );
        });

        it("should not change properties unless overriden", () => {
          cookieOptions = {
            domain: ".example.com",
          };

          session.middleware({ cookieOptions, sessionStore });

          expect(expressSession).toHaveBeenCalledWith(
            expect.objectContaining({
              cookie: expect.objectContaining({ secure: "auto" }),
            }),
          );
        });
      });
    });
  });
});
