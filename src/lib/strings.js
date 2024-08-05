const { randomBytes } = require("crypto");


function generateNonce() {
   return randomBytes(16).toString("hex");
};

module.exports = {
  generateNonce: generateNonce,
};
