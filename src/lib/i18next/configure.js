const defaultConfig = require("./default-config");

const configure = function ({ cookieDomain, debug = false, secure } = {}) {
  return {
    ...defaultConfig,
    debug: debug,
    detection: {
      ...defaultConfig.detection,
      cookieSecure: secure || defaultConfig?.detection?.cookieSecure,
      ...(cookieDomain && { cookieDomain: cookieDomain }),
    },
  };
};

module.exports = { configure };
