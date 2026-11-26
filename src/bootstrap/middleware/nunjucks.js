import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getConfig } from "../lib/config.js";
import nunjucks from "nunjucks";
import { addFrontendUiGlobals } from "@govuk-one-login/frontend-ui";
import { fileURLToPath } from "node:url";
import { getLogger } from "../lib/logger.js";
import { PACKAGE_NAME } from "../../lib/constants.js";

export const setupNunjucks = (
  app,
  { views = "views", hmpoComponentsDir, ...otherOptions } = {},
) => {
  const isDevEnv = Boolean(app.get("dev"));
  const APP_ROOT = getConfig("APP_ROOT");

  if (!Array.isArray(views)) views = [views];

  views = [
    ...views,
    ...(hmpoComponentsDir ? [resolve(hmpoComponentsDir, "components")] : []),
    resolve(
      dirname(fileURLToPath(import.meta.resolve("govuk-frontend"))),
      "..",
    ),
    resolve("node_modules/@govuk-one-login/"),
  ];

  views = views
    .map((dir) => resolve(APP_ROOT, dir))
    .filter((dir) => dir && existsSync(dir));

  getLogger(PACKAGE_NAME).debug(
    { views: { appRoot: APP_ROOT, dirs: views } },
    "Views",
  );

  const nunjucksEnv = nunjucks.configure(views, {
    express: app,
    dev: isDevEnv,
    noCache: isDevEnv,
    watch: isDevEnv,
    ...otherOptions,
  });

  addFrontendUiGlobals(nunjucksEnv);
  nunjucksEnv.addGlobal("MAY_2025_REBRAND_ENABLED", true);

  app.set("view engine", "html");
  app.set("nunjucks", nunjucksEnv);

  return nunjucksEnv;
};
