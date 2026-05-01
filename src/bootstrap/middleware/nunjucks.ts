import type { Express } from "express";

import createDebug from "debug";
import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import * as frontendUi from "@govuk-one-login/frontend-ui";

import * as config from "../lib/config";

const debug = createDebug("hmpo-app:nunjucks");

const setup = (
  app: Express,
  { views = "views", ...otherOptions }: { views?: string | string[]; otherOptions?: Record<string, unknown> } = {},
) => {
  const isDevEnv = Boolean(app.get("dev"));
  const APP_ROOT = config.get<string>("APP_ROOT");

  if (!Array.isArray(views)) views = [views];

  views = [
    ...views,
    path.resolve(
      path.dirname(require.resolve("hmpo-components")),
      "components",
    ),
    path.resolve(path.dirname(require.resolve("govuk-frontend")), ".."),
    path.resolve("node_modules/@govuk-one-login/"),
  ];

  views = views
    .map((dir) => path.resolve(APP_ROOT, dir))
    .filter((dir) => dir && fs.existsSync(dir));

  debug("Views", APP_ROOT, views);

  const nunjucksEnv = nunjucks.configure(views, {
    express: app,
    dev: isDevEnv,
    noCache: isDevEnv,
    watch: isDevEnv,
    ...otherOptions,
  });

  nunjucksEnv.addGlobal("addLanguageParam", frontendUi.addLanguageParam);
  nunjucksEnv.addGlobal("contactUsUrl", frontendUi.contactUsUrl);
  nunjucksEnv.addGlobal(
    "MAY_2025_REBRAND_ENABLED",
    process.env.MAY_2025_REBRAND_ENABLED === "true",
  );

  app.set("view engine", "html");
  app.set("nunjucks", nunjucksEnv);

  return nunjucksEnv;
};

export {
  setup
}
