const { expect } = require("chai");
const { generateNonce } = require("./strings");

describe("strings lib", () => {
  it("Make sure that the generateNone function returns a 32 character hex string", () => {
    const nonce = generateNonce();
    expect(nonce.length).to.equal(32);
  });
});
