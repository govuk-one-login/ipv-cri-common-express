import { it, expect, beforeEach, vi, describe } from "vitest";

vi.mock("i18next", () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));
vi.mock("i18next-fs-backend", () => ({ default: { i18nextFsBackend: true } }));
vi.mock("i18next-http-middleware", () => ({
  default: {
    LanguageDetector: "LanguageDetector",
    handle: vi.fn().mockReturnValue("instantiated handler"),
  },
}));

const defaultConfig = vi.hoisted(() => ({
  supportedLngs: ["en", "cy"],
}));
vi.mock("../../../src/lib/i18next/configure.js", () => ({
  configureI18next: vi.fn().mockReturnValue(defaultConfig),
}));

import { i18nextHandler } from "../../../src/lib/i18next/handler.js";
import i18next from "i18next";
import i18NextFsBackend from "i18next-fs-backend";
import i18NextHttpMiddleware from "i18next-http-middleware";
import { configureI18next } from "../../../src/lib/i18next/configure.js";

let configure;

configure = {
  configure: vi.fn().mockReturnValueOnce(defaultConfig),
};

describe("handler", () => {
  beforeEach(() => {
    vi.mocked(i18next.init).mockReset();
    configure.configure.mockReset();

    configure.configure.mockReturnValueOnce(defaultConfig);
  });

  it("should call i18next.use with backend", () => {
    i18nextHandler();
    expect(i18next.use).toHaveBeenNthCalledWith(1, i18NextFsBackend);
  });

  it("should call i18next.use with language detector", () => {
    i18nextHandler();
    expect(i18next.use).toHaveBeenNthCalledWith(
      2,
      i18NextHttpMiddleware.LanguageDetector,
    );
  });

  it("should call init with config", () => {
    i18nextHandler();

    expect(i18next.init).toHaveBeenCalledWith(defaultConfig);
  });

  it("should call configure with config from params", () => {
    i18nextHandler({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(configureI18next).toHaveBeenCalledWith({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
      additionalNamespaces: undefined,
    });
  });

  it("should thread additionalNamespaces through to configure", () => {
    i18nextHandler({ additionalNamespaces: ["frontend-ui"] });

    expect(configureI18next).toHaveBeenCalledWith(
      expect.objectContaining({ additionalNamespaces: ["frontend-ui"] }),
    );
  });

  it("should call onInit with i18next after init", () => {
    const onInit = vi.fn();
    i18nextHandler({ onInit });

    expect(onInit).toHaveBeenCalledWith(i18next);
    expect(onInit).to.have.been.calledAfter(i18next.init);
  });

  it("should not require onInit to be provided", () => {
    expect(() => i18nextHandler()).to.not.throw();
  });
  it("should call init with result from configure", () => {
    i18nextHandler({
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(i18next.init).toHaveBeenCalledWith(defaultConfig);
  });

  it("should call i18nextMiddleware.handle with options", () => {
    i18nextHandler();

    expect(i18NextHttpMiddleware.handle).toHaveBeenCalledWith(i18next, {
      ignoreRoutes: ["/public"],
    });
  });

  it("should return i18nextMiddleware handler", () => {
    let instantiatedHandler = i18nextHandler();

    expect(instantiatedHandler).toEqual("instantiated handler");
  });
});
