import { describe, expect, it, beforeEach, vi } from "vitest";

const modelOptions = require(
  APP_ROOT + "/src/bootstrap/middleware/model-options",
);

describe("Model options helper", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      sessionID: "SESSION",
      session: {
        scenarioID: "SCENARIO",
      },
    };
    res = {};
    next = vi.fn();
  });

  describe("middleware", () => {
    it("exports a function with length 3", () => {
      expect(typeof modelOptions.middleware()).toBe("function");
      expect(modelOptions.middleware()).toHaveLength(3);
    });

    it("creates a modelOptions method in req", () => {
      modelOptions.middleware()(req, res, next);
      expect(typeof req.modelOptions).toBe("function");
    });

    it("calls next", () => {
      modelOptions.middleware()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("req.modelOptions", () => {
    it("returns model options", () => {
      modelOptions.middleware()(req, res, next);
      let options = req.modelOptions();
      expect(options).toEqual({
        headers: {
          "X-SESSION-ID": "SESSION",
          "X-SCENARIO-ID": "SCENARIO",
        },
        logging: {
          req,
        },
      });
    });

    it("merges passed options with generated options", () => {
      modelOptions.middleware({
        sessionIDHeader: "HEADER1",
        scenarioIDHeader: "HEADER2",
        foo: "bar",
      })(req, res, next);
      let options = req.modelOptions({
        headers: { extra: "value", "X-SCENARIO-ID": "other" },
        logging: { key: "value" },
      });
      expect(options).toEqual({
        headers: {
          HEADER1: "SESSION",
          HEADER2: "SCENARIO",
          "X-SCENARIO-ID": "other",
          extra: "value",
        },
        logging: {
          req,
          key: "value",
        },
        foo: "bar",
      });
    });
  });
});
