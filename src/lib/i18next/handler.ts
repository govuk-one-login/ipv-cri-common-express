import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as i18nextMiddleware from "i18next-http-middleware";

import { configure } from "./configure";

const handler = ({
  cookieDomain = undefined,
  debug = undefined,
  secure = undefined,
}: {
  cookieDomain: string | undefined;
  debug: boolean | undefined;
  secure: boolean | undefined;
}) => {
  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(configure({ cookieDomain, debug, secure }));

  return i18nextMiddleware.handle(i18next, {
    ignoreRoutes: ["/public"], // or function(req, res, options, i18next) { /* return true to ignore */ }
  });
};

export { handler };
