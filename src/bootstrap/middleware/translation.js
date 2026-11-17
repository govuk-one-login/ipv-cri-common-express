const debug = require("debug")("hmpo-app:translations");
const config = require("../lib/config");
const path = require("node:path");
const fs = require("node:fs");

const loadHmpoI18n = () => {
  try {
    require.resolve("hmpo-i18n");
  } catch {
    throw new Error(
      "'hmpo-i18n' is not installed but is required by the \"locales\"/\"translation\" options. Add 'hmpo-i18n' to your dependencies.",
    );
  }
  return require("hmpo-i18n");
};

const setup = (
  app,
  { locales = ".", hmpoComponentsDir, ...otherOptions } = {},
) => {
  const i18n = loadHmpoI18n();
  const APP_ROOT = config.get("APP_ROOT");
  const isDevEnv = Boolean(app.get("dev"));

  if (!Array.isArray(locales)) locales = [locales];

  locales = [...locales, ...(hmpoComponentsDir ? [hmpoComponentsDir] : [])];

  locales = locales
    .map((dir) => path.resolve(APP_ROOT, dir))
    .filter((dir) => dir && fs.existsSync(dir));

  debug("Locales", APP_ROOT, locales);

  i18n.middleware(app, {
    baseDir: locales,
    noCache: isDevEnv,
    watch: isDevEnv,
    allowedLangs: ["en", "cy"],
    cookie: { name: "lang" },
    query: "lang",
    ...otherOptions,
  });
};

module.exports = {
  setup,
};
