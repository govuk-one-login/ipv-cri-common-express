const { describe } = require("mocha");
const index = require("./index");

describe("root module file", () => {
  it("provides expected keys at the root", () => {
    expect(Object.keys(index)).to.have.members(["lib", "routes", "bootstrap"]);

    expect(typeof index.lib).to.equal("object");
    expect(index.lib).not.to.equal(null);

    expect(typeof index.routes).to.equal("object");
    expect(index.routes).not.to.equal(null);

    expect(typeof index.bootstrap).to.equal("object");
    expect(index.bootstrap).not.to.equal(null);
  });
});
