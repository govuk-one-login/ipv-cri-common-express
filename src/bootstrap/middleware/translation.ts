import { createRequire } from "node:module";
import createDebug from "debug";
import * as config from "../lib/config";
import path from "node:path";
import fs from "node:fs";
import type { Express } from "express";
// @ts-expect-error hmpo-i18n has no type declarations
import i18n from "hmpo-i18n";

const require = createRequire(process.cwd() + "/");
const debug = createDebug("hmpo-app:translations");

const setup = (
  app: Express,
  {
    locales = ".",
    ...otherOptions
  }: { locales?: string | string[]; [key: string]: unknown } = {},
) => {
  const APP_ROOT = config.get<string>("APP_ROOT");
  const isDevEnv = Boolean(app.get("dev"));

  let localeDirs: string[] = Array.isArray(locales) ? locales : [locales];

  localeDirs = [
    ...localeDirs,
    path.dirname(require.resolve("hmpo-components")),
  ];

  localeDirs = localeDirs
    .map((dir) => path.resolve(APP_ROOT, dir))
    .filter((dir) => dir && fs.existsSync(dir));

  debug("Locales", APP_ROOT, localeDirs);

  i18n.middleware(app, {
    baseDir: localeDirs,
    noCache: isDevEnv,
    watch: isDevEnv,
    allowedLangs: ["en", "cy"],
    cookie: { name: "lang" },
    query: "lang",
    ...otherOptions,
  });
};

export { setup };
