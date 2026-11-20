import * as child_process from "node:child_process";
import * as util from "node:util";
import { describe, expect, it } from "vitest";

const exec = util.promisify(child_process.exec);

describe("checkTranslation", () => {
  it("should read the translated files and output logs for what are missing", async () => {
    let errored = false;
    try {
      await exec("npx tsx ./scripts/checkTranslations.js ./testFiles/fail");
    } catch (failOutput) {
      errored = true;
      // extract logs from output.
      if (failOutput.stdout instanceof String) {
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
          expect(
            message.includes("ENGLISH - Missing default.root.field3") ||
              message.includes(
                "ENGLISH - Missing default.root.nest.nest2.nestIsDifferent",
              ) ||
              message.includes("WELSH - Missing default.root.field2") ||
              message.includes("WELSH - Missing default.root.nest.nest2.nest3"),
          ).toEqual(true);
        }
      }
    }
    expect(errored).toBe(true);
  });

  it("should pass with no errors", async () => {
    const output = await exec(
      "npx tsx ./scripts/checkTranslations.js ./testFiles/success",
    );
    const stout = output.stdout.split("/n");
    const successMessage = !!stout.filter((val) =>
      val.includes("Translation files look good"),
    );

    expect(successMessage).toEqual(true);
  });

  it("should pass plurals with no errors", async () => {
    const output = await exec(
      "npx tsx ./scripts/checkTranslations.js ./testFiles/plurals",
    );
    const stout = output.stdout.split("/n");
    const successMessage = !!stout.filter((val) =>
      val.includes("Translation files look good"),
    );

    expect(successMessage).toEqual(true);
  });
});
