import { expect, describe, it } from "vitest";

const util = require("util");
const exec = util.promisify(require("child_process").exec);

describe("checkTranslation", () => {
  it("should read the translated files and output logs for what are missing", async () => {
    try {
      await exec("node ./scripts/checkTranslations.js ./testFiles/fail");
      expect.fail("CheckTranslations failed to fail");
    } catch (failOutput) {
      // extract logs from output.
      const logs = failOutput.stdout.split("\n");
      const warnings = logs.filter((val) => val.includes("warning"));
      const errors = logs.filter(
        (val) => val.includes("error") || val.includes("Missing"),
      );
      // remove descriptive logs
      warnings.shift();
      errors.shift();

      expect(warnings.length).toEqual(2);

      for (const message of warnings) {
        expect(message).toContain("warning");
        expect(message).toContain("length do not match");
      }

      expect(errors.length).toEqual(4);

      for (const message of errors) {
        expect(message).toSatisfy((val) => {
          if (val.includes("ENGLISH - Missing default.root.field3")) {
            return true;
          } else if (
            val.includes(
              "ENGLISH - Missing default.root.nest.nest2.nestIsDifferent",
            )
          ) {
            return true;
          } else if (val.includes("WELSH - Missing default.root.field2")) {
            return true;
          } else if (
            val.includes("WELSH - Missing default.root.nest.nest2.nest3")
          ) {
            return true;
          } else {
            return false;
          }
        });
      }
    }
  });

  it("should pass with no errors", async () => {
    const output = await exec(
      "node ./scripts/checkTranslations.js ./testFiles/success",
    );
    const stout = output.stdout.split("/n");
    const successMessage = !!stout.filter((val) =>
      val.includes("Translation files look good"),
    );

    expect(successMessage).toBe(true);
  });

  it("should pass plurals with no errors", async () => {
    const output = await exec(
      "node ./scripts/checkTranslations.js ./testFiles/plurals",
    );
    const stout = output.stdout.split("/n");
    const successMessage = !!stout.filter((val) =>
      val.includes("Translation files look good"),
    );

    expect(successMessage).toBe(true);
  });
});
