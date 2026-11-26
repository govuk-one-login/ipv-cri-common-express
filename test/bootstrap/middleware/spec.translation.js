import { describe, vi, it, expect, afterEach, beforeEach } from "vitest";
vi.mock("hmpo-i18n", () => ({
  default: {
    middleware: vi.fn(),
  },
}));
import i18n from "hmpo-i18n";
import { setupTranslation } from "../../../src/bootstrap/middleware/translation.js";

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
  });

  afterEach(() => {
    i18n.middleware.mockRestore();
  });

  it("should use the i18n middleware specifying the app root as the baseDir", async () => {
    await setupTranslation(app);
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should include hmpo-components locales when hmpoComponentsDir is provided", async () => {
    await setupTranslation(app, {
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

  it("should use the i18n middleware specifying a custom locales locations", async () => {
    await setupTranslation(app, { locales: [".", "./dir_not_found"] });
    expect(i18n.middleware).toHaveBeenCalledWith(app, {
      baseDir: [APP_ROOT + "/test/bootstrap/fixtures"],
      noCache: true,
      watch: true,
      allowedLangs: ["en", "cy"],
      cookie: { name: "lang" },
      query: "lang",
    });
  });

  it("should use the i18n middleware specifying a custom allowed lang list", async () => {
    await setupTranslation(app, { allowedLangs: ["fr"] });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        allowedLangs: ["fr"],
      }),
    );
  });

  it("should use the i18n middleware specifying a custom cookie name", async () => {
    await setupTranslation(app, { cookie: { name: "mycookie" } });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        cookie: { name: "mycookie" },
      }),
    );
  });

  it("should use the i18n middleware specifying a custum query lang", async () => {
    await setupTranslation(app, { query: "test" });
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        query: "test",
      }),
    );
  });

  it("should use the i18n middleware without dev flags in production", async () => {
    app.get.mockImplementation((arg) => {
      if (arg === "dev") return false;
    });
    await setupTranslation(app);
    expect(i18n.middleware).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        noCache: false,
        watch: false,
      }),
    );
  });

  describe("when hmpo-i18n is not installed", () => {
    it("should throw an error explaining hmpo-i18n is required", async () => {
      await expect(() =>
        setupTranslation(
          app,
          undefined,
          // simulate importHmpoI18n() failing
          () => {
            const error = new Error("Cannot find module 'hmpo-i18n'");
            error.code = "MODULE_NOT_FOUND";
            throw error;
          },
        ),
      ).rejects.toThrow("'hmpo-i18n' is not installed");

      expect(i18n.middleware).not.toHaveBeenCalled();
    });
  });
});
