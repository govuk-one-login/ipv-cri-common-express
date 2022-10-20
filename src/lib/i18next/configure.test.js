const { configure } = require("./configure");
const defaultConfig = require("./default-config");

describe("configure", () => {
  context("with no arguments", () => {
    it("should return default config", () => {
      let config = configure();

      expect(config).to.deep.equal({ debug: false, ...defaultConfig });
    });
  });

  context("with arguments", () => {
    it("should return config with overwridden properties", () => {
      let { detection, debug, ...configWithoutDetection } = configure({
        secure: true,
        cookieDomain: "localhost",
        debug: true,
      });

      expect(defaultConfig).to.include(configWithoutDetection);

      expect(debug).to.be.true;

      expect(detection).to.deep.equal({
        ...defaultConfig.detection,
        cookieSecure: true,
        cookieDomain: "localhost",
      });
    });
  });
});
