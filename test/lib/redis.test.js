import { expect, describe, it } from "vitest";
import { getRedisConfig } from "../../src/lib/redis.js";

describe("redis", () => {
  it("should return config using environment variables", () => {
    const redisConfig = getRedisConfig({
      SESSION_URL: "example.org",
      PORT: "4321",
    });

    expect(redisConfig).toMatchObject({
      connectionString: "redis://example.org:4321",
    });
  });

  it("should return empty config when no environment variables are given", () => {
    const redisConfig = getRedisConfig();

    expect(redisConfig).toEqual({});
  });
});
