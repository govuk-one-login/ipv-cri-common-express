import { describe, it, vi, beforeEach, expect } from "vitest";
vi.mock("../../../src/lib/i18next/replace-translate.js", () => ({
  replaceTranslate: vi.fn(),
}));
import { replaceTranslate } from "../../../src/lib/i18next/replace-translate.js";

vi.mock("../../../src/lib/i18next/handler.js", () => ({
  i18nextHandler: vi.fn().mockReturnValue("handler function"),
}));
import { i18nextHandler } from "../../../src/lib/i18next/handler.js";

import { setI18n } from "../../../src/lib/i18next/index.js";

describe("i18next", () => {
  const router = { use: vi.fn() };
  let config = { debug: true, secure: false, cookieDomain: "sub.domain.local" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use handler", () => {
    setI18n({ router, config });
    expect(router.use).toHaveBeenNthCalledWith(1, "handler function");
  });
  it("should call handler", () => {
    setI18n({ router, config });
    expect(i18nextHandler).toHaveBeenCalledWith({
      debug: true,
      secure: false,
      cookieDomain: "sub.domain.local",
      additionalNamespaces: undefined,
      onInit: undefined,
    });
  });
  it("should use replaceTranslate", () => {
    setI18n({ router, config });
    expect(router.use).toHaveBeenNthCalledWith(2, replaceTranslate);
  });

  it("should pass additionalNamespaces through to handler", () => {
    setI18n({
      router,
      config: { ...config, additionalNamespaces: ["frontend-ui"] },
    });

    expect(i18nextHandler).toHaveBeenCalledWith(
      expect.objectContaining({ additionalNamespaces: ["frontend-ui"] }),
    );
  });

  it("should pass onInit through to handler", () => {
    const onInit = vi.fn();
    setI18n({ router, config, onInit });

    expect(i18nextHandler).toHaveBeenCalledWith(
      expect.objectContaining({ onInit }),
    );
  });
});
