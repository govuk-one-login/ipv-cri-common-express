const nock = require("nock");

const {
  CustomFetchHttpError,
  customFetchMiddleware,
} = require("./custom-fetch");

describe("custom-fetch.js with nock stub", () => {
  let dummyReq = {
    app: {
      get: sinon.stub().withArgs("API.BASE_URL").returns("https://gov.uk"),
    },
  };
  const res = {};
  const next = sinon.stub();

  // Nock injects a stub into Node's internal HTTP code, which means we can get real fetch()
  // behaviour without making network calls
  let nockMock = nock("https://gov.uk");

  before(() => {
    customFetchMiddleware(dummyReq, res, next);
  });

  after(() => {
    nock.restore();
  });

  it("handles a successful response correctly", async () => {
    nockMock
      .get("/success")
      .reply(200, { success: true }, { someHeader: "very good" });

    const response = await dummyReq.customFetch("/success");

    const responseBody = await response.json();

    expect(response.status).to.equal(200);
    expect(response.headers.get("someHeader")).to.equal("very good");
    expect(responseBody).to.deep.equal({ success: true });
  });

  it("handles a 4xx response correctly", async () => {
    nockMock.get("/failure").reply(418, { coffeeForYou: false });

    let didItThrow = false;

    try {
      await dummyReq.customFetch("/failure");
    } catch (error) {
      if (error instanceof CustomFetchHttpError) {
        expect(error.code).to.equal(418);
        expect(error.message).to.equal(`Response not OK: I'm a Teapot`);

        expect(error.headers.get("content-type")).to.equal("application/json");

        const responseBody = JSON.parse(error.body);
        expect(responseBody).to.deep.equal({ coffeeForYou: false });

        didItThrow = true;
      }
    }

    expect(didItThrow).to.equal(true);
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
        expect(error.code).to.equal(500);
        expect(error.message).to.equal(
          "Response not OK: Internal Server Error",
        );

        expect(error.headers.get("content-type")).to.equal("text/plain");

        expect(error.body).to.equal("who knocked over the server");

        didItThrow = true;
      }
    }

    expect(didItThrow).to.equal(true);
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

    expect(response.status).to.equal(200);

    const responseBody = await response.json();

    expect(responseBody).to.deep.equal({
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

      expect(error instanceof DOMException).to.equal(true);
      expect(error.name).to.equal("TimeoutError");
      expect(error.message).to.equal(
        "The operation was aborted due to timeout",
      );
      hasThrown = true;
    }

    expect(hasThrown).to.equal(true);
  });
});
