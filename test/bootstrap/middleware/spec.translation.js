import { describe, vi, it, expect, afterEach, beforeEach } from "vitest";

const translation = require(APP_ROOT + "/src/bootstrap/middleware/translation");
const i18n = require("hmpo-i18n");

describe("translation middleware", () => {
  let app;

  beforeEach(() => {
    app = {
      use: vi.fn(),
      get: vi.fn(),
    };
    app.get.mockImplementation((arg) => {
      if (arg === "dev") return true;
    });

    vi.spyOn(i18n, "middleware");
  });

  afterEach(() => {
    i18n.middleware.mockRestore();
  });

  it("should use the i18n middleware specifying the app root as the baseDir", () => {
    translation.setup(app);
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should include hmpo-components locales when hmpoComponentsDir is provided", () => {
    translation.setup(app, {
      hmpoComponentsDir: APP_ROOT + "/node_modules/hmpo-components",
    });
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [
        APP_ROOT + "/test/bootstrap/fixtures",
        APP_ROOT + "/node_modules/hmpo-components",
      ],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should use the i18n middleware specifying a custom locales locations", () => {
    translation.setup(app, { locales: [".", "./dir_not_found"] });
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should use the i18n middleware specifying a custom allowed lang list", () => {
    translation.setup(app, { allowedLangs: ["fr"] });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        allowedLangs: ["fr"],
      }),
    );
  });

  it("should use the i18n middleware specifying a custom cookie name", () => {
    translation.setup(app, { cookie: { name: "mycookie" } });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        cookie: { name: "mycookie" },
      }),
    );
  });

  it("should use the i18n middleware specifying a custum query lang", () => {
    translation.setup(app, { query: "test" });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        query: "test",
      }),
    );
  });

  it("should use the i18n middleware without dev flags in production", () => {
    app.get.mockImplementation((arg) => {
      if (arg === "dev") return false;
    });
    translation.setup(app);
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        noCache: false,
        watch: false,
      }),
    );
  });
});
