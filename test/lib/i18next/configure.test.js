import { describe, it, expect } from "vitest";

import { configureI18next } from "../../../src/lib/i18next/configure.js";
import { defaultI18nextConfig } from "../../../src/lib/i18next/default-config.js";

describe("configure", () => {
  it("should return default config", () => {
    let config = configureI18next();

    expect(config).toEqual({ debug: false, ...defaultI18nextConfig });
  });

  it("should return config with overwridden properties", () => {
    let { detection, debug, ...configWithoutDetection } = configureI18next({
      secure: true,
      cookieDomain: "localhost",
      debug: true,
    });

    expect(defaultI18nextConfig).toMatchObject(configWithoutDetection);

    expect(debug).toBe(true);

    expect(detection).toEqual({
      ...defaultI18nextConfig.detection,
      cookieSecure: true,
      cookieDomain: "localhost",
    });
  });

  it("should merge additionalNamespaces into ns", () => {
    const config = configureI18next({ additionalNamespaces: ["frontend-ui"] });

    expect(config.ns).toEqual([...defaultI18nextConfig.ns, "frontend-ui"]);
  });

  it("should not modify ns when additionalNamespaces is empty", () => {
    const config = configureI18next({ additionalNamespaces: [] });

    expect(config.ns).toEqual(defaultI18nextConfig.ns);
  });
});
