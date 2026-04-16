import defaultConfig from "./default-config";

const configure = ({
  cookieDomain,
  debug = false,
  secure,
}: {
  cookieDomain: string | undefined;
  debug: boolean | undefined;
  secure: boolean | undefined;
}) => {
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

export { configure };
