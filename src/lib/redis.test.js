import { expect, describe, it } from "vitest";
describe("redis", () => {
  const redis = require("./redis");

  it("should return config using environment variables", () => {
    const redisConfig = redis({ SESSION_URL: "example.org", PORT: "4321" });

    expect(redisConfig).toMatchObject({
      connectionString: "redis://example.org:4321",
    });
  });

  it("should return empty config when no environment variables are given", () => {
    const redisConfig = redis();

    expect(redisConfig).toEqual({});
  });
});
