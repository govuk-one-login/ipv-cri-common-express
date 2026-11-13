import { defaultI18nextConfig } from "./default-config.js";

export function configureI18next({
  cookieDomain,
  debug = false,
  secure,
  additionalNamespaces = [],
} = {}) {
  return {
    ...defaultI18nextConfig,
    ns: [...defaultI18nextConfig.ns, ...additionalNamespaces],
    debug: debug,
    detection: {
      ...defaultI18nextConfig.detection,
      cookieSecure: secure || defaultI18nextConfig?.detection?.cookieSecure,
      ...(cookieDomain && { cookieDomain: cookieDomain }),
    },
  };
}
