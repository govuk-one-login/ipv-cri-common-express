const { configure } = require("../../../src/bootstrap/lib/overload-protection");

describe("overload-protection (configure)", () => {
  describe("without environment variables", () => {
    it("should have default values", () => {
      const values = configure();

      expect(values).to.deep.equal({
        production: "production",
        clientRetrySecs: 1,
        sampleInterval: 5,
        maxEventLoopDelay: 500,
        maxHeapUsedBytes: 0,
        maxRssBytes: 0,
        errorPropagationMode: false,
        logging: false,
        logStatsOnReq: false,
      });
    });

    it("should have use overrides from parameters", () => {
      const parameters = {
        production: "development",
        clientRetrySecs: 10,
        sampleInterval: 50,
        maxEventLoopDelay: 5000,
        maxHeapUsedBytes: 10,
        maxRssBytes: 10,
        errorPropagationMode: true,
        logging: true,
        logStatsOnReq: true,
      };

      const values = configure(parameters);

      expect(values).to.deep.equal(parameters);
    });

    it("should have use partial overrides from parameters with fallback defaults", () => {
      const parameters = {
        production: "development",
        logging: true,
      };

      const values = configure(parameters);

      expect(values).to.deep.equal({
        clientRetrySecs: 1,
        errorPropagationMode: false,
        logStatsOnReq: false,
        logging: true,
        maxEventLoopDelay: 500,
        maxHeapUsedBytes: 0,
        maxRssBytes: 0,
        production: "development",
        sampleInterval: 5,
      });
    });
  });

  describe("with environment variables", () => {
    beforeEach(() => {
      process.env.OVERLOAD_PROTECTION_MAX_EVENT_LOOP_DELAY = 900;
    });

    afterEach(() => {
      delete process.env.OVERLOAD_PROTECTION_MAX_EVENT_LOOP_DELAY;
    });

    it("should have use overrides for maxEventLoopDelay from environment", () => {
      const values = configure();

      expect(values).to.deep.equal({
        production: "production",
        clientRetrySecs: 1,
        sampleInterval: 5,
        maxEventLoopDelay: 900,
        maxHeapUsedBytes: 0,
        maxRssBytes: 0,
        errorPropagationMode: false,
        logging: false,
        logStatsOnReq: false,
      });
    });

    it("should have use overrides maxEventLoopDelay from parameters before environment", () => {
      const values = configure({ maxEventLoopDelay: 1200 });

      expect(values).to.deep.equal({
        production: "production",
        clientRetrySecs: 1,
        sampleInterval: 5,
        maxEventLoopDelay: 1200,
        maxHeapUsedBytes: 0,
        maxRssBytes: 0,
        errorPropagationMode: false,
        logging: false,
        logStatsOnReq: false,
      });
    });
  });
});
