import { expect, it, describe, vi, beforeEach } from "vitest";

import {
  customFetchMiddleware,
  CustomFetchHttpError,
  DNS_ERROR_LOG_MESSAGE,
} from "../../src/lib/custom-fetch.js";

const badResponse = {
  status: 418,
  ok: false,
  statusText: "I'm a Teapot",
  text: async () => "no coffee for you",
  headers: new Headers({ "some-header": "illegal" }),
};

describe("custom-fetch.js with global.fetch mock", () => {
  describe("CustomFetchHttpError", () => {
    it("provides response data as expected given valid input", async () => {
      const error = new CustomFetchHttpError(
        badResponse,
        await badResponse.text(),
      );
      expect(error.code).toEqual(418);
      expect(error.body).toEqual("no coffee for you");
      expect(error.message).toEqual(`Response not OK: I'm a Teapot`);
      expect(error.headers.get("some-header")).toEqual("illegal");
    });
  });

  describe("customFetch()", () => {
    let dummyReq;
    let loggerStub;
    const res = {};
    const next = vi.fn();

    const fetchResponse = { ok: true, status: 200, text: () => "hello" };

    global.fetch = vi.fn().mockReturnValue(fetchResponse);

    beforeEach(() => {
      vi.clearAllMocks();

      dummyReq = {
        app: {
          get: vi.fn().mockImplementation((arg) => {
            if (arg === "API.BASE_URL") return "https://gov.uk";
          }),
        },
      };
      loggerStub = LOGGER_RESET();
    });

    describe("customFetchMiddleware()", () => {
      it("runs the middleware to attach the customFetch function to the req object", () => {
        customFetchMiddleware(dummyReq, res, next);
        expect(typeof dummyReq.customFetch).toEqual("function");
        expect(next).toHaveBeenCalledTimes(1);
      });

      it("calls next(error) if an error is thrown while building the fetch function", () => {
        const badReq = { ...dummyReq, headers: { forwarded: 1000 } };

        customFetchMiddleware(badReq, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls.at(-1)[0]).toBeInstanceOf(Error);
      });

      [
        ["empty", { app: { get: vi.fn().mockReturnValueOnce("") } }],
        ["null", { app: { get: vi.fn().mockReturnValueOnce(null) } }],
        [
          "error",
          {
            app: {
              get: vi.fn().mockImplementation(() => {
                throw new Error();
              }),
            },
          },
        ],
      ].forEach(([scenario, badReq]) => {
        it(`passes an error if it cannot get the base URL (${scenario} scenario)`, () => {
          customFetchMiddleware(badReq, res, next);
          expect(next).toHaveBeenCalledTimes(1);
          expect(next.mock.calls.at(-1)[0]).toBeInstanceOf(Error);
        });
      });
    });

    describe("tests without special headers on req", () => {
      beforeEach(() => {
        customFetchMiddleware(dummyReq, res, next);
      });

      it("calls the fetch function correctly", async () => {
        const response = await dummyReq.customFetch("/path/something/here", {
          method: "GET",
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          { method: "GET", headers: {} },
        );

        expect(response).toEqual(fetchResponse);
      });

      it("throws if a path is given without a leading slash", async () => {
        let errorThrown = false;

        try {
          await dummyReq.customFetch("path/something/here");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toEqual("Given path should start with '/'");
          errorThrown = true;
        }

        expect(errorThrown).toEqual(true);
      });

      it("logs the request at debug level", async () => {
        await dummyReq.customFetch("/path/something/here", {
          method: "GET",
          timeoutMs: 10000,
        });

        expect(loggerStub.debug).toHaveBeenCalledWith(
          {
            api: {
              method: "GET",
              path: "/path/something/here",
              timeoutMs: 10000,
            },
          },
          "API request",
        );
      });

      it("redacts sensitive query parameters from the logged path", async () => {
        await dummyReq.customFetch("/token?code=secret&other=fine");

        expect(loggerStub.info).toHaveBeenCalledWith(
          expect.objectContaining({
            api: expect.objectContaining({
              path: "/token?code=hidden&other=fine",
            }),
          }),
          "API response",
        );
      });

      it("logs the response status and duration", async () => {
        await dummyReq.customFetch("/path/something/here", { method: "POST" });

        expect(loggerStub.info).toHaveBeenCalledWith(
          {
            api: {
              method: "POST",
              path: "/path/something/here",
              statusCode: 200,
              durationMs: expect.any(Number),
            },
          },
          "API response",
        );
      });

      it("logs a non-OK response as a warning", async () => {
        global.fetch = vi.fn().mockResolvedValue(badResponse);

        await expect(
          dummyReq.customFetch("/path/something/here"),
        ).rejects.toBeInstanceOf(CustomFetchHttpError);

        global.fetch = vi.fn().mockResolvedValue(fetchResponse);

        expect(loggerStub.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            api: expect.objectContaining({ statusCode: 418 }),
          }),
          "API response",
        );
      });

      it("serialises the provided jsonBody correctly", async () => {
        await dummyReq.customFetch("/path/something/here", {
          method: "POST",
          jsonBody: { hello: true, good: 1 },
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: `{"hello":true,"good":1}`,
          },
        );
      });

      it("correctly passes an AbortSignal to the fetch API", async () => {
        const fakeAbortSignal = { isAbortSignal: true };
        const abortSignalMock = vi
          .spyOn(global.AbortSignal, "timeout")
          .mockReturnValue(fakeAbortSignal);

        await dummyReq.customFetch("/path/something/here", {
          method: "GET",
          timeoutMs: 50,
        });

        expect(abortSignalMock).toHaveBeenCalledTimes(1);
        expect(abortSignalMock).toHaveBeenCalledWith(50);

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            method: "GET",
            headers: {},
            signal: fakeAbortSignal,
          },
        );
        abortSignalMock.mockReset();
      });

      describe("known network errors", () => {
        const buildFetchFailure = (cause) =>
          Object.assign(new TypeError("fetch failed"), { cause });

        const expectDnsErrorLogged = (expectedDns, expectedApi = {}) => {
          expect(loggerStub.error).toHaveBeenCalledTimes(1);
          expect(loggerStub.error).toHaveBeenCalledWith(
            expect.objectContaining({
              api: expect.objectContaining(expectedApi),
              dns: expect.objectContaining(expectedDns),
            }),
            DNS_ERROR_LOG_MESSAGE,
          );
        };

        const expectRethrown = async (thrownError) => {
          global.fetch = vi.fn().mockRejectedValue(thrownError);

          await expect(
            dummyReq.customFetch("/path/something/here", { method: "GET" }),
          ).rejects.toBe(thrownError);

          global.fetch = vi.fn().mockResolvedValue(fetchResponse);
        };

        it("logs an identifiable entry when the API hostname does not resolve", async () => {
          await expectRethrown(
            buildFetchFailure(
              Object.assign(new Error("getaddrinfo ENOTFOUND api.gov.uk"), {
                code: "ENOTFOUND",
                syscall: "getaddrinfo",
                hostname: "api.gov.uk",
              }),
            ),
          );

          expectDnsErrorLogged(
            {
              code: "ENOTFOUND",
              syscall: "getaddrinfo",
              hostname: "api.gov.uk",
            },
            {
              method: "GET",
              path: "/path/something/here",
              durationMs: expect.any(Number),
            },
          );
          expect(loggerStub.error.mock.calls[0][0].error).toEqual(
            expect.objectContaining({
              name: "TypeError",
              message: "fetch failed",
              cause: expect.objectContaining({ code: "ENOTFOUND" }),
            }),
          );
        });

        it("logs an identifiable entry for a temporary resolver failure", async () => {
          await expectRethrown(
            buildFetchFailure(
              Object.assign(new Error("getaddrinfo EAI_AGAIN api.gov.uk"), {
                code: "EAI_AGAIN",
              }),
            ),
          );

          expectDnsErrorLogged({ code: "EAI_AGAIN" });
        });

        it("finds a DNS error nested in an AggregateError", async () => {
          await expectRethrown(
            buildFetchFailure(
              new AggregateError([
                Object.assign(new Error("connect ECONNREFUSED"), {
                  code: "ECONNREFUSED",
                }),
                Object.assign(new Error("getaddrinfo ENOTFOUND api.gov.uk"), {
                  code: "ENOTFOUND",
                }),
              ]),
            ),
          );

          expectDnsErrorLogged({ code: "ENOTFOUND" });
        });

        it("logs other network failures without DNS details", async () => {
          Object.assign(dummyReq, {
            method: "POST",
            originalUrl: "/choose-bank",
          });

          await expectRethrown(
            buildFetchFailure(
              Object.assign(new Error("connect ECONNREFUSED"), {
                code: "ECONNREFUSED",
              }),
            ),
          );

          expect(loggerStub.error).toHaveBeenCalledTimes(1);
          const [logObject, message] = loggerStub.error.mock.calls[0];
          expect(message).toEqual("API request failed");
          expect(logObject).not.toHaveProperty("dns");
          expect(logObject.error.cause.code).toEqual("ECONNREFUSED");
          expect(logObject.http).toEqual({
            method: "POST",
            path: "/choose-bank",
          });
        });

        it("does not follow a cycle in the error cause chain", async () => {
          const cause = Object.assign(new Error("looping"), {
            code: "ECONNRESET",
          });
          const error = buildFetchFailure(cause);
          cause.cause = error;

          await expectRethrown(error);

          expect(loggerStub.error).toHaveBeenCalledWith(
            expect.not.objectContaining({ dns: expect.anything() }),
            "API request failed",
          );
        });
      });

      it("throws CustomFetchHttpError if the request fails", async () => {
        let didItThrow = false;

        global.fetch = vi.fn().mockResolvedValue(badResponse);
        try {
          await dummyReq.customFetch("/path/something/here", {
            method: "GET",
          });
        } catch (error) {
          global.fetch = vi.fn().mockResolvedValue(fetchResponse);

          expect(error).toBeInstanceOf(CustomFetchHttpError);
          expect(error.code).toEqual(418);
          expect(error.body).toEqual("no coffee for you");
          expect(error.message).toEqual(`Response not OK: I'm a Teapot`);
          expect(error.headers.get("some-header")).toEqual("illegal");

          didItThrow = true;
        }

        expect(didItThrow).toEqual(true);
      });
    });

    describe("setting headers passed down from the user req", () => {
      it("correctly attaches the scenario ID", async () => {
        const scenarioReq = { ...dummyReq, scenarioIDHeader: "hello" };

        customFetchMiddleware(scenarioReq, res, next);

        await scenarioReq.customFetch("/path/something/here");

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            headers: {
              "x-scenario-id": "hello",
            },
          },
        );
      });

      it("correctly attaches ipv4 addresses in x-forwarded-for", async () => {
        const forwardedReq = {
          ...dummyReq,
          headers: {
            forwarded:
              "host=subdomain.example.gov.uk;for=  192.0.2.0  ;proto=https",
          },
        };

        customFetchMiddleware(forwardedReq, res, next);

        await forwardedReq.customFetch("/path/something/here");

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            headers: {
              "x-forwarded-for": "192.0.2.0",
            },
          },
        );
      });

      it("correctly attaches ipv6 addresses in x-forwarded-for", async () => {
        const forwardedReq = {
          ...dummyReq,
          headers: {
            forwarded:
              "host=subdomain.example.gov.uk;for=2001:db8:3333:4444:5555:6666:7777:8888;proto=https",
          },
        };

        customFetchMiddleware(forwardedReq, res, next);

        await forwardedReq.customFetch("/path/something/here");

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            headers: {
              "x-forwarded-for": "2001:db8:3333:4444:5555:6666:7777:8888",
            },
          },
        );
      });

      it("prefers values from req over headers passed into the fetch call", async () => {
        const forwardedReq = {
          ...dummyReq,
          scenarioIDHeader: "hello",
          headers: {
            forwarded:
              "host=subdomain.example.gov.uk;for=  192.0.2.0  ;proto=https",
          },
        };

        customFetchMiddleware(forwardedReq, res, next);

        await forwardedReq.customFetch("/path/something/here", {
          headers: { "x-scenario-id": "no!", "x-forwarded-for": "bad!" },
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gov.uk/path/something/here",
          {
            headers: {
              "x-scenario-id": "hello",
              "x-forwarded-for": "192.0.2.0",
            },
          },
        );
      });
    });
  });
});
