import { vi } from "vitest";

const reqres = require("reqres");
const JourneyModel = require("hmpo-form-wizard/lib/journey-model");
const WizardModel = require("hmpo-form-wizard/lib/wizard-model.js");

export const createDefaultReqResNext = () => {
  const req = reqres.req({
    form: {
      options: {
        fields: {},
      },
    },
    customFetch: vi.fn(),
  });

  req.journeyModel = new JourneyModel(null, {
    req,
    key: "test",
  });

  req.sessionModel = new WizardModel(null, {
    req,
    key: "test",
    journeyModel: req.journeyModel,
    fields: {},
  });

  const res = reqres.res({});
  res.redirect = vi.fn();
  const next = vi.fn();
  return {
    req,
    res,
    next,
  };
};
