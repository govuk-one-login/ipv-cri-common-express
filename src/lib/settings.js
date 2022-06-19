const { generateNonce } = require("./strings");

module.exports = {
  setGTM: ({ app, id, scriptNonce }) => {
    app.set("APP.GTM.ID", id);
    app.set("APP.GTM.SCRIPT_NONCE", scriptNonce || generateNonce());
  },
};
