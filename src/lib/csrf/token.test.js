const token = require("./token");

describe("lib/csrf/token", () => {
  const consumerSecrets = ["hunter2"]; // pragma: allowlist secret
  const currentSessionCsrfSecret = "top-secret"; // pragma: allowlist secret

  describe("createSessionSecret", () => {
    it("returns a non-empty string", () => {
      const secret = token.setSessionSecret();
      expect(secret).to.be.a("string");
      expect(secret.length).to.be.greaterThan(0);
    });

    it("returns a different value each call", () => {
      expect(token.setSessionSecret()).to.not.equal(token.setSessionSecret());
    });
  });

  describe("create / verify", () => {
    it("creates a token that verifies with the same secrets", () => {
      const t = token.create(consumerSecrets, currentSessionCsrfSecret);
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, t),
      ).to.equal(true);
    });

    it("produces a fresh salt on each call", () => {
      const a = token.create(consumerSecrets, currentSessionCsrfSecret);
      const b = token.create(consumerSecrets, currentSessionCsrfSecret);
      expect(a).to.not.equal(b);
    });

    it("signs with the first secret in the list", () => {
      const t = token.create(["new", "old"], currentSessionCsrfSecret);
      expect(token.verify(["new"], currentSessionCsrfSecret, t)).to.equal(true);
      expect(token.verify(["old"], currentSessionCsrfSecret, t)).to.equal(
        false,
      );
    });

    it("rejects a token signed with a different consumer secret", () => {
      const t = token.create(["Tr0ub4dor&3"], currentSessionCsrfSecret);
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, t),
      ).to.equal(false);
    });

    it("rejects a token signed with a different session secret", () => {
      const t = token.create(consumerSecrets, "not-my-session-secret");
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, t),
      ).to.equal(false);
    });

    it("rejects a tampered signature", () => {
      const t = token.create(consumerSecrets, currentSessionCsrfSecret);
      const [salt, sig] = t.split(".");
      const tampered = `${salt}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`;
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, tampered),
      ).to.equal(false);
    });

    it("rejects a tampered salt", () => {
      const t = token.create(consumerSecrets, currentSessionCsrfSecret);
      const [salt, sig] = t.split(".");
      const tampered = `${salt.slice(0, -1)}${salt.endsWith("A") ? "B" : "A"}.${sig}`;
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, tampered),
      ).to.equal(false);
    });

    it("rejects mismatched signature length without throwing", () => {
      const t = token.create(consumerSecrets, currentSessionCsrfSecret);
      const [salt, sig] = t.split(".");
      expect(
        token.verify(
          consumerSecrets,
          currentSessionCsrfSecret,
          `${salt}.${sig}extra`,
        ),
      ).to.equal(false);
    });

    it("rejects non-string tokens", () => {
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, undefined),
      ).to.equal(false);
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, null),
      ).to.equal(false);
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, 42),
      ).to.equal(false);
    });

    it("rejects a token with no separator", () => {
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, "nosalt"),
      ).to.equal(false);
    });

    it("rejects a token with an empty salt or signature", () => {
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, ".sig"),
      ).to.equal(false);
      expect(
        token.verify(consumerSecrets, currentSessionCsrfSecret, "salt."),
      ).to.equal(false);
    });
  });

  describe("rotation window", () => {
    it("verifies tokens signed by the old secret while both are accepted", () => {
      const oldToken = token.create(["old"], currentSessionCsrfSecret);
      expect(
        token.verify(["new", "old"], currentSessionCsrfSecret, oldToken),
      ).to.equal(true);
    });

    it("verifies tokens signed by the new secret while both are accepted", () => {
      const newToken = token.create(["new"], currentSessionCsrfSecret);
      expect(
        token.verify(["new", "old"], currentSessionCsrfSecret, newToken),
      ).to.equal(true);
    });

    it("rejects tokens once the old secret is removed", () => {
      const oldToken = token.create(["old"], currentSessionCsrfSecret);
      expect(
        token.verify(["new"], currentSessionCsrfSecret, oldToken),
      ).to.equal(false);
    });

    it("rejects tokens signed by an unknown secret even with multiple accepted", () => {
      const rogue = token.create(["rogue"], currentSessionCsrfSecret);
      expect(
        token.verify(["new", "old"], currentSessionCsrfSecret, rogue),
      ).to.equal(false);
    });
  });

  describe("hmac key encoding", () => {
    it("treats pairs as distinct", () => {
      const tokenA = token.create(["foo"], "barbazqux");
      expect(token.verify(["foobar"], "bazqux", tokenA)).to.equal(false);
    });

    it("treats pairs that share a delimiter as distinct", () => {
      const tokenA = token.create(["foo:bar"], "bazqux");
      expect(token.verify(["foo"], "bar:bazqux", tokenA)).to.equal(false);
    });
  });
});
