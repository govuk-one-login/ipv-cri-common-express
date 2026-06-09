const logger = require("../bootstrap/lib/logger");
const { PACKAGE_NAME } = require("./constants");

const logInfo = logger.get(PACKAGE_NAME).info;

const {
  CustomFetchHttpError,
  customFetchMiddleware,
} = require("./custom-fetch");

const badResponse = {
  status: 418,
  ok: false,
  statusText: "I'm a Teapot",
  text: async () => "no coffee for you",
  headers: new Headers({ "some-header": "illegal" }),
};

describe("custom-fetch.js", () => {
  describe("CustomFetchHttpError", () => {
    it("provides response data as expected given valid input", async () => {
      const error = new CustomFetchHttpError(
        badResponse,
        await badResponse.text(),
      );
      expect(error.code).to.equal(418);
      expect(error.body).to.equal("no coffee for you");
      expect(error.message).to.equal(`Response not OK: I'm a Teapot`);
      expect(error.headers.get("some-header")).to.equal("illegal");
    });
  });

  describe("customFetch()", () => {
    let dummyReq;
    const res = {};
    const next = sinon.stub();

    const fetchResponse = { ok: true, statusCode: 200, text: () => "hello" };
    global.fetch = sinon.stub().returns(fetchResponse);

    beforeEach(() => {
      dummyReq = {
        app: {
          get: sinon.stub().withArgs("API.BASE_URL").returns("https://gov.uk"),
        },
      };
      sinon.resetHistory();
    });

    describe("customFetchMiddleware()", () => {
      it("runs the middleware to attach the customFetch function to the req object", () => {
        customFetchMiddleware(dummyReq, res, next);
        expect(typeof dummyReq.customFetch).to.equal("function");
        sinon.assert.calledOnce(next);
      });

      it("calls next(error) if an error is thrown while building the fetch function", () => {
        const badReq = { ...dummyReq, headers: { forwarded: 1000 } };

        customFetchMiddleware(badReq, res, next);
        sinon.assert.calledOnce(next);
        expect(next.lastCall.firstArg).to.be.instanceof(Error);
      });

      [
        ["empty", { app: { get: sinon.stub().returns("") } }],
        ["null", { app: { get: sinon.stub().returns(null) } }],
        ["error", { app: { get: sinon.stub().throws(new Error()) } }],
      ].forEach(([scenario, badReq]) => {
        it(`passes an error if it cannot get the base URL (${scenario} scenario)`, () => {
          customFetchMiddleware(badReq, res, next);
          sinon.assert.calledOnce(next);
          expect(next.lastCall.firstArg).to.be.instanceof(Error);
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

        sinon.assert.calledWith(
          global.fetch,
          "https://gov.uk/path/something/here",
          { method: "GET", headers: {} },
        );

        expect(response).to.equal(fetchResponse);
      });

      it("throws if a path is given without a leading slash", async () => {
        let errorThrown = false;

        try {
          await dummyReq.customFetch("path/something/here");
        } catch (error) {
          expect(error instanceof Error).to.equal(true);
          expect(error.message).to.equal("Given path should start with '/'");
          errorThrown = true;
        }

        expect(errorThrown).to.equal(true);
      });

      it("logs the correct request information", async () => {
        await dummyReq.customFetch("/path/something/here", {
          method: "GET",
          timeoutMs: 10000,
        });

        sinon.assert.calledWith(logInfo, "API request", {
          config: {
            baseURL: "https://gov.uk",
            method: "GET",
            timeout: 10000,
          },
          req: dummyReq,
        });
      });

      it("serialises the provided jsonBody correctly", async () => {
        await dummyReq.customFetch("/path/something/here", {
          method: "POST",
          jsonBody: { hello: true, good: 1 },
        });

        sinon.assert.calledWith(
          global.fetch,
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
        const abortSignalMock = sinon
          .stub(global.AbortSignal, "timeout")
          .returns(fakeAbortSignal);

        await dummyReq.customFetch("/path/something/here", {
          method: "GET",
          timeoutMs: 50,
        });

        sinon.assert.calledOnce(abortSignalMock);
        sinon.assert.calledWith(abortSignalMock, 50);

        sinon.assert.calledWith(
          global.fetch,
          "https://gov.uk/path/something/here",
          {
            method: "GET",
            headers: {},
            signal: fakeAbortSignal,
          },
        );

        abortSignalMock.restore();
      });

      it("throws CustomFetchHttpError if the request fails", async () => {
        let didItThrow = false;

        global.fetch.returns(badResponse);
        try {
          await dummyReq.customFetch("/path/something/here", {
            method: "GET",
          });
        } catch (error) {
          global.fetch.returns(fetchResponse);

          expect(error).to.be.an.instanceof(CustomFetchHttpError);
          expect(error.code).to.equal(418);
          expect(error.body).to.equal("no coffee for you");
          expect(error.message).to.equal(`Response not OK: I'm a Teapot`);
          expect(error.headers.get("some-header")).to.equal("illegal");

          didItThrow = true;
        }

        expect(didItThrow).to.equal(true);
      });
    });

    describe("setting headers passed down from the user req", () => {
      it("correctly attaches the scenario ID", async () => {
        const scenarioReq = { ...dummyReq, scenarioIDHeader: "hello" };

        customFetchMiddleware(scenarioReq, res, next);

        await scenarioReq.customFetch("/path/something/here");

        sinon.assert.calledWith(
          global.fetch,
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

        sinon.assert.calledWith(
          global.fetch,
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

        sinon.assert.calledWith(
          global.fetch,
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

        sinon.assert.calledWith(
          global.fetch,
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
