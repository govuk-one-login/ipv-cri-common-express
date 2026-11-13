import debugLib from "debug";
import { getConfig } from "../lib/config";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const debug = debugLib("hmpo-app:translations");

function loadHmpoI18n() {
  try {
    return import("hmpo-i18n");
  } catch {
    throw new Error(
      "'hmpo-i18n' is not installed but is required by the \"locales\"/\"translation\" options. Add 'hmpo-i18n' to your dependencies.",
    );
  }
}

export async function setupTranslation(
  app,
  { locales = ".", hmpoComponentsDir, ...otherOptions } = {},
) {
  const hmpoI18n = await loadHmpoI18n();

  const APP_ROOT = getConfig("APP_ROOT");
  const isDevEnv = Boolean(app.get("dev"));

  if (!Array.isArray(locales)) locales = [locales];

  locales = [...locales, ...(hmpoComponentsDir ? [hmpoComponentsDir] : [])];

  locales = locales
    .map((dir) => resolve(APP_ROOT, dir))
    .filter((dir) => dir && existsSync(dir));

  debug("Locales", APP_ROOT, locales);

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
