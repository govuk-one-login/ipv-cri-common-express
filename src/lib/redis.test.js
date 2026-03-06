describe("redis", () => {
  const redis = require("./redis");

  context("with environment variables", () => {
    it("should return config using environment variables", () => {
      const redisConfig = redis({ SESSION_URL: "example.org", PORT: "4321" });

      expect(redisConfig).to.include({
        connectionString: "redis://example.org:4321",
      });
    });
  });

  context("without environment variables", () => {
    it("should return empty config", () => {
      const redisConfig = redis();

      expect(redisConfig).to.deep.equal({});
    });
  });
});
