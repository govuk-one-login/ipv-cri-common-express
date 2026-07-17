import { describe, vi, expect, it, beforeEach, afterEach } from "vitest";

const nunjucks = require("nunjucks");
const { setup: setupNunjucks } = require(
  APP_ROOT + "/src/bootstrap/middleware/nunjucks",
);

describe("nunjucks middleware", () => {
  let app, nunjucksEnv;

  beforeEach(() => {
    app = {
      set: vi.fn(),
      get: vi.fn(),
    };
    app.get.mockReturnValue(true);

    vi.spyOn(nunjucks, "configure");
    nunjucksEnv = {};
    nunjucksEnv.addGlobal = vi.fn();
    nunjucks.configure.mockReturnValue(nunjucksEnv);
  });

  afterEach(() => {
    nunjucks.configure.mockRestore();
  });

  it("should configure nunjucks with a default set of views and options", () => {
    setupNunjucks(app);
    expect(nunjucks.configure).toHaveBeenCalledWith(
      [
        APP_ROOT + "/test/bootstrap/fixtures/views",
        APP_ROOT + "/node_modules/govuk-frontend/dist",
        APP_ROOT + "/node_modules/@govuk-one-login",
      ],
      {
        express: app,
        dev: true,
        noCache: true,
        watch: true,
      },
    );
  });

  it("should configure nunjucks with hmpo-components views when hmpoComponentsDir is provided", () => {
    const hmpoComponentsDir = APP_ROOT + "/node_modules/hmpo-components";
    setupNunjucks(app, { hmpoComponentsDir });
    expect(nunjucks.configure).toHaveBeenCalledWith(
      [
        APP_ROOT + "/test/bootstrap/fixtures/views",
        APP_ROOT + "/node_modules/hmpo-components/components",
        APP_ROOT + "/node_modules/govuk-frontend/dist",
        APP_ROOT + "/node_modules/@govuk-one-login",
      ],
      expect.any(Object),
    );
  });

  it("should filter out a view if not present", () => {
    setupNunjucks(app, { views: ["views", "not_found"] });
    expect(nunjucks.configure).toHaveBeenCalledWith(
      [
        APP_ROOT + "/test/bootstrap/fixtures/views",
        APP_ROOT + "/node_modules/govuk-frontend/dist",
        APP_ROOT + "/node_modules/@govuk-one-login",
      ],
      expect.any(Object),
    );
  });

  it("should run in prod mode if dev flag not set", () => {
    app.get.mockReturnValue(false);

    setupNunjucks(app);
    expect(nunjucks.configure).toHaveBeenCalledWith(expect.any(Array), {
      express: app,
      dev: false,
      noCache: false,
      watch: false,
    });
  });

  it("should set the view engine value", () => {
    setupNunjucks(app);
    expect(app.set).toHaveBeenCalledWith("view engine", "html");
  });

  it("should set the Nunjucks environment", () => {
    const result = setupNunjucks(app);
    expect(result).toEqual(nunjucksEnv);
  });
});
