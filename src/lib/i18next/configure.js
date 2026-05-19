const defaultConfig = require("./default-config");

const configure = function ({
  cookieDomain,
  debug = false,
  secure,
  additionalNamespaces = [],
} = {}) {
  return {
    ...defaultConfig,
    ns: [...defaultConfig.ns, ...additionalNamespaces],
    debug: debug,
    detection: {
      ...defaultConfig.detection,
      cookieSecure: secure || defaultConfig?.detection?.cookieSecure,
      ...(cookieDomain && { cookieDomain: cookieDomain }),
    },
  };
};

module.exports = { configure };
