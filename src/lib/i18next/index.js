import { i18nextHandler } from "./handler.js";
import { replaceTranslate } from "./replace-translate.js";

export const setI18n = ({
  router,
  config: { cookieDomain, debug, secure, additionalNamespaces },
  onInit,
}) => {
  router.use(
    i18nextHandler({
      cookieDomain,
      debug,
      secure,
      additionalNamespaces,
      onInit,
    }),
  );
  router.use(replaceTranslate);
};
