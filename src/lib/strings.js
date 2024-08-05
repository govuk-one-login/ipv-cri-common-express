const { randomBytes } = require("crypto");

module.exports = {
  generateNonce: function generateNonce() {
    const buffer = await new Promise((resolve, reject) => {
      crypto.randomBytes(16, function(ex, buffer) {
        if (ex) {
          reject("error generating token");
        }
        resolve(buffer.toString("hex"));
      });
    })
};
