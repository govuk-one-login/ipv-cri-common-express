const { randomBytes } = require("crypto");

module.exports = {
  generateNonce: function generateNonce() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, function(ex, buffer) {
        if (ex) {
          reject("error generating token");
        }
        resolve(buffer.toString("hex"));
      });
    })
      crypto.randomBytes(16, function(ex, buffer) {
        if (ex) {
          reject("error generating token");
        }
        resolve(buffer.toString("hex"));
      });
    })
};
