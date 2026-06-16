const crypto = require("node:crypto");

const SALT_BYTES = 16;
const SESSION_SECRET_BYTES = 32;
const TOKEN_SEPARATOR = ".";

const toBase64Url = (buffer) => buffer.toString("base64url");

const setSessionSecret = () =>
  toBase64Url(crypto.randomBytes(SESSION_SECRET_BYTES));

const hmac = (consumerSecret, currentSessionCsrfSecret, salt) =>
  toBase64Url(
    crypto
      .createHmac(
        "sha256",
        `${consumerSecret.length}:${consumerSecret}:${currentSessionCsrfSecret}`,
      )
      .update(salt)
      .digest(),
  );

const timingSafeEqualString = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const create = (consumerSecrets, currentSessionCsrfSecret) => {
  const salt = toBase64Url(crypto.randomBytes(SALT_BYTES));
  return `${salt}${TOKEN_SEPARATOR}${hmac(consumerSecrets[0], currentSessionCsrfSecret, salt)}`;
};

const verify = (consumerSecrets, currentSessionCsrfSecret, token) => {
  if (typeof token !== "string") return false;

  const separatorIndex = token.indexOf(TOKEN_SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) return false;

  const salt = token.slice(0, separatorIndex);
  const provided = token.slice(separatorIndex + 1);

  let matched = false;
  for (const secret of consumerSecrets) {
    if (
      timingSafeEqualString(
        provided,
        hmac(secret, currentSessionCsrfSecret, salt),
      )
    ) {
      matched = true;
    }
  }
  return matched;
};

module.exports = {
  create,
  verify,
  setSessionSecret,
};
