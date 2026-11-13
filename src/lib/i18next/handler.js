import i18next from "i18next";
import fsBackend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";

import { configureI18next } from "./configure.js";

export const i18nextHandler = ({
  cookieDomain,
  debug,
  secure,
  additionalNamespaces,
  onInit,
} = {}) => {
  i18next
    .use(fsBackend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(
      configureI18next({ cookieDomain, debug, secure, additionalNamespaces }),
    );

  onInit?.(i18next);

  return i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ["/public"], // or function(req, res, options, i18next) { /* return true to ignore */ }
  });
};
