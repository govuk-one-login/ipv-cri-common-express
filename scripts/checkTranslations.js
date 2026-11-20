import { lstatSync, readdirSync } from "node:fs";
import path, { join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import { differenceWith } from "lodash-es";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const SCRIPT_NAME = "TRANSLATION CHECK -";

const fileLoc = process.argv[2] ? process.argv[2] : "../../../src/locales";

const foundLanguages = readdirSync(join(__dirname, fileLoc)).filter(
  (fileName) => {
    const joinedPath = join(join(__dirname, fileLoc), fileName);
    const isDirectory = lstatSync(joinedPath).isDirectory();
    return isDirectory;
  },
);

const foundNamespaces = readdirSync(join(__dirname, `${fileLoc}/en`)).reduce(
  (collection, fileName) => {
    const joinedPath = join(join(__dirname, `${fileLoc}/en`), fileName);
    const isFile = lstatSync(joinedPath).isFile();
    if (isFile) {
      collection.push(parse(fileName).name);
    }

    return collection;
  },
  [],
);

// set up i18next on the backedn with saveMissing set to true.
i18next.use(Backend).init({
  // debug: true,
  initImmediate: true,
  supportedLngs: ["en", "cy"],
  preload: foundLanguages,
  ns: foundNamespaces,
  defaultNS: "default",
  backend: {
    loadPath: join(__dirname, `${fileLoc}/{{lng}}/{{ns}}.yml`),
  },
  saveMissingTo: "current",
});

// --------.-----------

function compareContent(set1, set2, parent) {
  const issues = [];
  const warnings = [];

  const differences = differenceWith(
    Object.keys(set1),
    Object.keys(set2),
    (arrVal, othVal) => {
      return arrVal.split("_")[0] === othVal.split("_")[0];
    },
  );

  console.log(differences);
  differences.map((difference) => {
    issues.push(`Missing ${parent ? `${parent}.` : ""}${difference}`);
  });

  for (const key of Object.keys(set1)) {
    let set1Field = set1[key];
    let set2Field = set2[key];

    // // Thankful for the poor JS null/undefined system.
    // // Null = field exists but no value.
    // // undefined = field does not exist...
    // // This should catch where we have empty "hint" fields.
    if (set1Field === null && set1Field !== undefined) {
      set1Field = "_";
    }

    if (set2Field === null && set1Field !== undefined) {
      set2Field = "_";
    }

    if (Array.isArray(set1Field) && Array.isArray(set2Field)) {
      const set1ArrayLength = set1Field.length;
      const set2ArrayLength = set2Field.length;
      if (set1ArrayLength !== set2ArrayLength) {
        warnings.push(`Array ${key} length do not match`);
      }
    }

    if (
      typeof set1Field === "object" &&
      !Array.isArray(set1Field) &&
      typeof set2Field === "object" &&
      !Array.isArray(set2Field)
    ) {
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

  let missingEnglish;
  let missingWelsh;

  if (welshContent !== undefined && englishContent !== undefined) {
    missingEnglish = compareContent(welshContent, englishContent);
  } else {
    missingEnglish = {
      issues: [],
      warnings: [],
    };
  }
  if (welshContent !== undefined && englishContent !== undefined) {
    missingWelsh = compareContent(englishContent, welshContent);
  } else {
    missingWelsh = {
      issues: [],
      warnings: [],
    };
  }

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
