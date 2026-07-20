import { describe, it, vi, beforeEach, expect } from "vitest";

const proxyquire = require("proxyquire");
const handler = vi.fn().mockReturnValueOnce("handler function");
const replaceTranslate = vi.fn();

const { setI18n, i18next } = proxyquire("./", {
  "./handler": {
    handler,
  },
  "./replace-translate": {
    replaceTranslate,
  },
});

describe("i18next", () => {
  let router;
  let config;

  beforeEach(() => {
    router = { use: vi.fn() };
    config = { debug: true, secure: false, cookieDomain: "sub.domain.local" };

    setI18n({ router, config });
  });

  it("should use handler", () => {
    expect(router.use).toHaveBeenNthCalledWith(1, "handler function");
  });
  it("should call handler", () => {
    expect(handler).toHaveBeenCalledWith({
      debug: true,
      secure: false,
      cookieDomain: "sub.domain.local",
      additionalNamespaces: undefined,
      onInit: undefined,
    });
  });
  it("should use replaceTranslate", () => {
    expect(router.use).toHaveBeenNthCalledWith(2, replaceTranslate);
  });

  it("should pass additionalNamespaces through to handler", () => {
    handler.mockClear();
    setI18n({
      router,
      config: { ...config, additionalNamespaces: ["frontend-ui"] },
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ additionalNamespaces: ["frontend-ui"] }),
    );
  });

  it("should pass onInit through to handler", () => {
    handler.mockClear();
    const onInit = vi.fn();
    setI18n({ router, config, onInit });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ onInit }));
  });

  it("should export the i18next singleton", () => {
    expect(i18next).toEqual(require("i18next"));
  });
});
