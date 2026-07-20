import { expect, describe, it, beforeEach, vi } from "vitest";
import { createDefaultReqResNext } from "../../../test/utils/helpers";

const proxyquire = require("proxyquire");

describe("replaceTranslate", () => {
  let req;
  let res;
  let next;
  let warn;
  let replaceTranslate;

  beforeEach(() => {
    const setup = createDefaultReqResNext();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.translate = undefined;

    req.i18n = {
      getFixedT: vi.fn(),
      language: "en",
    };

    warn = vi.fn();
    ({ replaceTranslate } = proxyquire("./replace-translate", {
      "../../bootstrap/lib/logger": {
        get: vi.fn().mockReturnValueOnce({ warn }),
      },
    }));
  });

  it("should call getFixedT with language", () => {
    replaceTranslate(req, res, next);

    expect(req.i18n.getFixedT).toHaveBeenCalledWith(req.i18n.language);
  });

  it("should replace translate with getFixedT function", () => {
    const translate = vi.fn();
    req.i18n.getFixedT.mockReturnValueOnce(translate);
    replaceTranslate(req, res, next);

    expect(req.translate).toEqual(translate);
  });

  it("should set res.locals.translate as a function", () => {
    replaceTranslate(req, res, next);

    expect(typeof res.locals.translate).toBe("function");
  });

  it("should call translate with res.locals spread as interpolation context", () => {
    const translate = vi.fn();
    req.i18n.getFixedT.mockReturnValueOnce(translate);
    res.locals.favFood = "Sausage";

    replaceTranslate(req, res, next);
    res.locals.translate("some.key");

    expect(translate).toHaveBeenCalledWith(
      "some.key",
      expect.objectContaining({ favFood: "Sausage" }),
    );
  });

  it("should allow opts to override res.locals in interpolation context", () => {
    const translate = vi.fn();
    req.i18n.getFixedT.mockReturnValueOnce(translate);
    res.locals.favFood = "Sausage";

    replaceTranslate(req, res, next);
    res.locals.translate("some.key", { favFood: "Saucisson" });

    expect(translate).toHaveBeenCalledWith(
      "some.key",
      expect.objectContaining({ favFood: "Saucisson" }),
    );
  });

  it("should not overwrite an existing res.locals.translate", () => {
    const existing = vi.fn();
    res.locals.translate = existing;

    replaceTranslate(req, res, next);

    expect(res.locals.translate).toEqual(existing);
  });

  it("should warn when res.locals.translate is already set", () => {
    res.locals.translate = vi.fn();

    replaceTranslate(req, res, next);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("should only warn once across multiple requests", () => {
    res.locals.translate = vi.fn();

    replaceTranslate(req, res, next);
    replaceTranslate(req, res, next);
    replaceTranslate(req, res, next);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("should not warn when res.locals.translate is unset", () => {
    replaceTranslate(req, res, next);

    expect(warn).not.toHaveBeenCalled();
  });

  it("should call next", () => {
    replaceTranslate(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
