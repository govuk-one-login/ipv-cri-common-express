import { getConfig } from "../lib/config.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { PACKAGE_NAME } from "../../lib/constants.js";
import { getLogger } from "../lib/logger.js";

export async function loadI18n() {
  return (await import("hmpo-i18n")).default;
}

export async function setupTranslation(
  app,
  { locales = ".", hmpoComponentsDir, ...otherOptions } = {},
  loadHmpoI18n = loadI18n,
) {
  let hmpoI18n;
  try {
    hmpoI18n = await loadHmpoI18n();
  } catch {
    throw new Error(
      "'hmpo-i18n' is not installed but is required by the \"locales\"/\"translation\" options. Add 'hmpo-i18n' to your dependencies.",
    );
  }

  const APP_ROOT = getConfig("APP_ROOT");
  const isDevEnv = Boolean(app.get("dev"));

  if (!Array.isArray(locales)) locales = [locales];

  locales = [...locales, ...(hmpoComponentsDir ? [hmpoComponentsDir] : [])];

  locales = locales
    .map((dir) => resolve(APP_ROOT, dir))
    .filter((dir) => dir && existsSync(dir));

  getLogger(PACKAGE_NAME).debug(
    { locales: { appRoot: APP_ROOT, localeDirs: locales } },
    "Locales",
  );

  hmpoI18n.middleware(app, {
    baseDir: locales,
    noCache: isDevEnv,
    watch: isDevEnv,
    allowedLangs: ["en", "cy"],
    cookie: { name: "lang" },
    query: "lang",
    ...otherOptions,
  });
}
