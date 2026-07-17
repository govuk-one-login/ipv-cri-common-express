import { describe, expect, it } from "vitest";

const index = require("./index");

describe("root module file", () => {
  it("provides expected keys at the root", () => {
    expect(Object.keys(index)).toEqual(
      expect.arrayContaining(["lib", "routes", "bootstrap"]),
    );

    expect(typeof index.lib).toEqual("object");
    expect(index.lib).not.toEqual(null);

    expect(typeof index.routes).toEqual("object");
    expect(index.routes).not.toEqual(null);

    expect(typeof index.bootstrap).toEqual("object");
    expect(index.bootstrap).not.toEqual(null);
  });
});
