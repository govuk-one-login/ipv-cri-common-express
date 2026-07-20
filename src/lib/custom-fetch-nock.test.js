import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";

const nock = require("nock");

const {
  CustomFetchHttpError,
  customFetchMiddleware,
} = require("./custom-fetch");

describe("custom-fetch.js with nock stub", () => {
  let dummyReq = {
    app: {
      get: vi.fn().mockImplementation((args) => {
        if (args === "API.BASE_URL") return "https://gov.uk";
      }),
    },
  };
  const res = {};
  const next = vi.fn();

  // Nock injects a stub into Node's internal HTTP code, which means we can get real fetch()
  // behaviour without making network calls
  let nockMock = nock("https://gov.uk");

  beforeAll(() => {
    customFetchMiddleware(dummyReq, res, next);
  });

  afterAll(() => {
    nock.restore();
  });

  it("handles a successful response correctly", async () => {
    nockMock
      .get("/success")
      .reply(200, { success: true }, { someHeader: "very good" });

    const response = await dummyReq.customFetch("/success");

    const responseBody = await response.json();

    expect(response.status).toEqual(200);
    expect(response.headers.get("someHeader")).toEqual("very good");
    expect(responseBody).toEqual({ success: true });
  });

  it("handles a 4xx response correctly", async () => {
    nockMock.get("/failure").reply(418, { coffeeForYou: false });

    let didItThrow = false;

    try {
      await dummyReq.customFetch("/failure");
    } catch (error) {
      if (error instanceof CustomFetchHttpError) {
        expect(error.code).toEqual(418);
        expect(error.message).toEqual(`Response not OK: I'm a Teapot`);

        expect(error.headers.get("content-type")).toEqual("application/json");

        const responseBody = JSON.parse(error.body);
        expect(responseBody).toEqual({ coffeeForYou: false });

        didItThrow = true;
      }
    }

    expect(didItThrow).toEqual(true);
  });

  it("handles a 5xx response correctly", async () => {
    nockMock
      .delete("/internal-server-error")
      .reply(500, "who knocked over the server", {
        "content-type": "text/plain",
      });

    let didItThrow = false;

    try {
      await dummyReq.customFetch("/internal-server-error", {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof CustomFetchHttpError) {
        expect(error.code).toEqual(500);
        expect(error.message).toEqual("Response not OK: Internal Server Error");

        expect(error.headers.get("content-type")).toEqual("text/plain");

        expect(error.body).toEqual("who knocked over the server");

        didItThrow = true;
      }
    }

    expect(didItThrow).toEqual(true);
  });

  it("sends method, body and headers correctly", async () => {
    nockMock.put("/echo").reply(200, function (uri, body) {
      return {
        yourPath: this.req.path,
        yourBody: body,
        yourHeaders: this.req.headers,
      };
    });

    const response = await dummyReq.customFetch("/echo", {
      method: "PUT",
      headers: { "dummy-header": "hello" },
      jsonBody: { veryGood: "yes" },
    });

    expect(response.status).toEqual(200);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      yourPath: "/echo",
      yourBody: { veryGood: "yes" },
      yourHeaders: {
        "content-type": "application/json",
        "dummy-header": "hello",
        host: "gov.uk",
      },
    });
  });

  it("respects a given timeout", async () => {
    nockMock.post("/long-running-request").delay(500).reply(200);

    let hasThrown = false;

    const start = performance.now();
    try {
      await dummyReq.customFetch("/long-running-request", {
        method: "POST",
        timeoutMs: 100,
      });
    } catch (error) {
      const timeElapsed = performance.now() - start;
      nock.abortPendingRequests();
      expect(timeElapsed).to.be.closeTo(100, 10);

      expect(error).toBeInstanceOf(DOMException);
      expect(error.name).toEqual("TimeoutError");
      expect(error.message).toEqual("The operation was aborted due to timeout");
      hasThrown = true;
    }

    expect(hasThrown).toEqual(true);
  });
});
