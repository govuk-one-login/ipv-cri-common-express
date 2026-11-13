import { it, expect, beforeEach, vi, describe } from "vitest";

const proxyquire = require("proxyquire").noCallThru();

let handler;
let i18next;
let i18NextFsBackend;
let i18NextHttpMiddleware;
let defaultConfig;
let configure;

defaultConfig = {
  supportedLngs: ["en", "cy"],
};

i18next = {
  use: vi.fn().mockReturnThis(),
  init: vi.fn(),
};

i18NextHttpMiddleware = {
  LanguageDetector: "LanguageDetector",
  handle: vi.fn().mockReturnValue("instantiated handler"),
};

configure = {
  configure: vi.fn().mockReturnValueOnce(defaultConfig),
};

i18NextFsBackend = vi.fn();

handler = proxyquire("./handler", {
  i18next,
  "i18next-fs-backend": i18NextFsBackend,
  "i18next-http-middleware": i18NextHttpMiddleware,
  "./configure": configure,
});
describe("handler", () => {
  beforeEach(() => {
    i18next.init.mockReset();
    configure.configure.mockReset();

    configure.configure.mockReturnValueOnce(defaultConfig);
  });

  it("should call i18next.use with backend", () => {
    handler.handler();
    expect(i18next.use).toHaveBeenNthCalledWith(1, i18NextFsBackend);
  });

  it("should call i18next.use with language detector", () => {
    handler.handler();
    expect(i18next.use).toHaveBeenNthCalledWith(
      2,
      i18NextHttpMiddleware.LanguageDetector,
    );
  });

  it("should call init with config", () => {
    handler.handler();

    expect(i18next.init).toHaveBeenCalledWith(defaultConfig);
  });

  it("should call configure with config from params", () => {
    handler.handler({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(configure.configure).toHaveBeenCalledWith({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
      additionalNamespaces: undefined,
    });
  });

  it("should thread additionalNamespaces through to configure", () => {
    handler.handler({ additionalNamespaces: ["frontend-ui"] });

    expect(configure.configure).toHaveBeenCalledWith(
      expect.objectContaining({ additionalNamespaces: ["frontend-ui"] }),
    );
  });

  it("should call onInit with i18next after init", () => {
    const onInit = vi.fn();
    handler.handler({ onInit });

    expect(onInit).toHaveBeenCalledWith(i18next);
    expect(onInit).to.have.been.calledAfter(i18next.init);
  });

  it("should not require onInit to be provided", () => {
    expect(() => handler.handler()).to.not.throw();
  });
  it("should call init with result from configure", () => {
    handler.handler({
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(i18next.init).toHaveBeenCalledWith(defaultConfig);
  });

  it("should call i18nextMiddleware.handle with options", () => {
    handler.handler();

    expect(i18NextHttpMiddleware.handle).toHaveBeenCalledWith(i18next, {
      ignoreRoutes: ["/public"],
    });
  });

  it("should return i18nextMiddleware handler", () => {
    let instantiatedHandler = handler.handler();

    expect(instantiatedHandler).toEqual("instantiated handler");
  });
});
