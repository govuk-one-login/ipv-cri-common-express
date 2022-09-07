/* eslint-disable no-console */
const { join, parse } = require("path");
const { readdirSync, lstatSync } = require("fs");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");

const SCRIPT_NAME = "TRANSLATION CHECK -";

const foundLanguages = readdirSync(join(__dirname, "../../../src/locales")).filter(
  (fileName) => {
    const joinedPath = join(join(__dirname, "../../../src/locales"), fileName);
    const isDirectory = lstatSync(joinedPath).isDirectory();
    return isDirectory;
  }
);

const foundNamespaces = readdirSync(
  join(__dirname, "../../../src/locales/en")
).reduce((collection, fileName) => {
  const joinedPath = join(join(__dirname, "../../../src/locales/en"), fileName);
  const isFile = lstatSync(joinedPath).isFile();
  if (isFile) {
    collection.push(parse(fileName).name);
  }

  return collection;
}, []);

// set up i18next on the backedn with saveMissing set to true.
i18next.use(Backend).init({
  // debug: true,
  initImmediate: true,
  supportedLngs: ["en", "cy"],
  preload: foundLanguages,
  ns: foundNamespaces,
  defaultNS: "default",
  backend: {
    loadPath: join(__dirname, "../../../src/locales/{{lng}}/{{ns}}.yml"),
  },
  saveMissingTo: "current",
});

// --------.-----------

function compareContent(set1, set2, parent) {
  const issues = [];
  const warnings = [];
  for (const key of Object.keys(set1)) {
    let set1Field = set1[key];
    let set2Field = set2[key];

    // Thankful for the poor JS null/undefined system.
    // Null = field exists but no value.
    // undefined = field does not exist...
    // This should catch where we have empty "hint" fields.
    if (set1Field === null && set1Field !== undefined) {
      set1Field = "_";
    }

    if (set2Field === null && set1Field !== undefined) {
      set2Field = "_";
    }

    if (!set2Field) {
      // example:
      issues.push(`Missing ${parent ? parent + "." : ""}${key}`);
      continue;
    }

    if (Array.isArray(set1Field)) {
      const set1ArrayLength = set1Field.length;
      const set2ArrayLength = set2Field.length;
      if (set1ArrayLength !== set2ArrayLength) {
        warnings.push(`Array ${key} length do not match`);
      }
    }

    if (typeof set1Field === "object" && !Array.isArray(set1Field)) {
      const parentKey = parent ? `${parent}.${key}` : key; // handle if we're nested more than one level down
      const nestedResults = compareContent(set1Field, set2Field, parentKey);
      issues.push(...nestedResults.issues);
      warnings.push(...nestedResults.warnings);
    }
  }
  return { issues, warnings };
}

(async () => {
  await i18next.changeLanguage("cy");
  const welshContent = i18next.getDataByLanguage("cy");
  await i18next.changeLanguage("en");
  const englishContent = i18next.getDataByLanguage("en");

  const missingEnglish = compareContent(welshContent, englishContent);
  const missingWelsh = compareContent(englishContent, welshContent);

  if (missingEnglish.warnings.length > 0 || missingWelsh.warnings.length > 0) {
    console.log(`${SCRIPT_NAME} warnings found..`);
    for (const missingEn of missingEnglish.warnings) {
      console.log(`${SCRIPT_NAME} warning ENGLISH - ${missingEn}`);
    }

    for (const missingCy of missingWelsh.warnings) {
      console.log(`${SCRIPT_NAME} warning: WELSH - ${missingCy}`);
    }
  }

  if (missingEnglish.issues.length > 0 || missingWelsh.issues.length > 0) {
    console.log(`${SCRIPT_NAME} errors found..`);
    for (const missingEn of missingEnglish.issues) {
      console.log(`${SCRIPT_NAME} ENGLISH - ${missingEn}`);
    }

    for (const missingCy of missingWelsh.issues) {
      console.log(`${SCRIPT_NAME} WELSH - ${missingCy}`);
    }
    process.exit(1);
  }
  console.log(`${SCRIPT_NAME} Translation files look good`);
})();
