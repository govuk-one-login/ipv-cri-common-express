import { describe, it, beforeEach, vi, expect } from "vitest";
import {
  featureFlagMiddleware,
  getFlags,
  isFlagDisabled,
  isFlagEnabled,
  redirectIfFlagDisabled,
  redirectIfFlagEnabled,
  routeIfFlagEnabled,
} from "../../../src/bootstrap/middleware/feature-flag.js";
import hmpoReqRes from "hmpo-reqres";

describe("Feature Flag", () => {
  let options;
  let middleware;
  let req;
  let res;
  let next;

  beforeEach(() => {
    options = {
      featureFlags: {
        flagFromConfig: true,
      },
    };

    req = {
      featureFlags: {
        enabledFlag: true,
        disabledFlag: false,
      },
      session: {
        featureFlags: {
          flagFromSession: true,
        },
      },
    };

    res = hmpoReqRes.res();
    res.redirect = vi.fn();
    next = vi.fn();

    middleware = featureFlagMiddleware(options);
  });

  describe("#middleware", () => {
    it("should copy options.featureFlags and session.featureFlags to req.featureFlags", () => {
      middleware(req, res, next);

      expect(req.featureFlags).toEqual({
        enabledFlag: true,
        disabledFlag: false,
        flagFromConfig: true,
        flagFromSession: true,
      });
    });

    it("should ignore nonexistant feature flag sources", () => {
      middleware = featureFlagMiddleware();
      delete req.featureFlags;
      delete req.session;

      middleware(req, res, next);

      expect(req.featureFlags).toEqual({});
    });

    it("should deep clone featureFlags", () => {
      middleware(req, res, next);

      expect(req.featureFlags).not.toEqual(options.featureFlags);
      expect(req.featureFlags).not.toEqual(req.session.featureFlags);
      req.featureFlags.flagFromConfig = false;
      expect(options.featureFlags.flagFromConfig).toBe(true);
    });

    it("should keep existing object reference", () => {
      const originalFlags = { originalFlag: true };
      req.featureFlags = originalFlags;
      middleware(req, res, next);
      expect(req.featureFlags).toEqual(originalFlags);
      expect(req.featureFlags.originalFlag).toBe(true);
      expect(req.featureFlags.flagFromConfig).toBe(true);
    });

    it("should set the res.locals.featureFlags object to the updated featureflags", () => {
      req.featureFlags = { originalFlag: true };
      middleware(req, res, next);
      expect(res.locals.featureFlags).toEqual({
        originalFlag: true,
        flagFromConfig: true,
        flagFromSession: true,
      });
    });

    it("should call next with no arguments", () => {
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("#getFlags", () => {
    it("should return the current flags from the req", () => {
      expect(getFlags(req)).toEqual({
        enabledFlag: true,
        disabledFlag: false,
      });
    });

    it("should return en empty object if there are no flags in the req", () => {
      delete req.featureFlags;
      expect(getFlags(req)).toEqual({});
    });

    it("should not cache flag results", () => {
      req.featureFlags.varyingFlag = true;

      let flags = getFlags(req);
      expect(flags.varyingFlag).toEqual(true);

      req.featureFlags.varyingFlag = false;

      flags = getFlags(req);
      expect(flags.varyingFlag).toEqual(false);
    });
  });

  describe("#isEnabled", () => {
    it("should call getFlags to fetch the current flags from the req", () => {
      expect(isFlagEnabled("enabledFlag", req)).toBe(true);
    });

    it("should be true with an enabled flag", () => {
      expect(isFlagEnabled("enabledFlag", req)).toBe(true);
    });

    it("should be false with an disabled flag", () => {
      expect(isFlagEnabled("disabledFlag", req)).toBe(false);
    });

    it("should be false with a non existing flag", () => {
      expect(isFlagEnabled("nonExistingFlag", req)).toBe(false);
    });
  });

  describe("#isDisabled", () => {
    it("should be false with an enabled flag", () => {
      expect(isFlagDisabled("enabledFlag", req)).toBe(false);
    });

    it("should be true with an disabled flag", () => {
      expect(isFlagDisabled("disabledFlag", req)).toBe(true);
    });

    it("should be true with an non existing flag", () => {
      expect(isFlagDisabled("nonExistingFlag", req)).toBe(true);
    });
  });

  describe("#redirectIfEnabled", () => {
    it("should redirect with an enabled flag", () => {
      middleware = redirectIfFlagEnabled("enabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith("http://example.org");
    });

    it("should not call next with an enabled flag", () => {
      middleware = redirectIfFlagEnabled("enabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it("should not redirect with a disabled flag", () => {
      middleware = redirectIfFlagEnabled("disabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should call next with a disabled flag", () => {
      middleware = redirectIfFlagEnabled("disabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should not redirect with a non existing flag", () => {
      middleware = redirectIfFlagEnabled(
        "nonExistingFlag",
        "http://example.org",
      );
      middleware(req, res, next);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should call next with a non existing flag", () => {
      middleware = redirectIfFlagEnabled(
        "nonExistingFlag",
        "http://example.org",
      );
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("#redirectIfDisabled", () => {
    it("should not redirect with an enabled flag", () => {
      middleware = redirectIfFlagDisabled("enabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should call next with an enabled flag", () => {
      middleware = redirectIfFlagDisabled("enabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should redirect with a disabled flag", () => {
      middleware = redirectIfFlagDisabled("disabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith("http://example.org");
    });

    it("should not call next with a disabled flag", () => {
      middleware = redirectIfFlagDisabled("disabledFlag", "http://example.org");
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it("should redirect with a non existing flag", () => {
      middleware = redirectIfFlagDisabled(
        "nonExistingFlag",
        "http://example.org",
      );
      middleware(req, res, next);
      expect(res.redirect).toHaveBeenCalled();
    });

    it("should not call next with a non existing flag", () => {
      middleware = redirectIfFlagDisabled(
        "nonExistingFlag",
        "http://example.org",
      );
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("#routeIfEnabled", () => {
    let ifMiddleware, elseMiddleware;

    beforeEach(() => {
      ifMiddleware = vi.fn();
      elseMiddleware = vi.fn();
    });

    it("should route to ifMiddleware with an enabled flag", () => {
      middleware = routeIfFlagEnabled(
        "enabledFlag",
        ifMiddleware,
        elseMiddleware,
      );

      middleware(req, res, next);

      expect(ifMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(elseMiddleware).not.toHaveBeenCalled();
    });

    it("should route to elseMiddleware with a disabled flag", () => {
      middleware = routeIfFlagEnabled(
        "disabledFlag",
        ifMiddleware,
        elseMiddleware,
      );

      middleware(req, res, next);

      expect(elseMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(ifMiddleware).not.toHaveBeenCalled();
    });

    it("should route to elseMiddleware with a non existing flag", () => {
      middleware = routeIfFlagEnabled(
        "nonExistingFlag",
        ifMiddleware,
        elseMiddleware,
      );

      middleware(req, res, next);

      expect(elseMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(ifMiddleware).not.toHaveBeenCalled();
    });

    it("should route to elseMiddleware with a no flag", () => {
      middleware = routeIfFlagEnabled(undefined, ifMiddleware, elseMiddleware);

      middleware(req, res, next);

      expect(elseMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(ifMiddleware).not.toHaveBeenCalled();
    });
  });
});
