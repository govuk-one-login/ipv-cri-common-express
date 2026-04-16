import { handler } from "./handler";
import { replaceTranslate } from "./replace-translate";
import type { Router } from "express";

type I18nSettings = {
  router: Router;
  config: {
    cookieDomain?: string;
    debug?: boolean;
    secure?: boolean;
  };
};

const setI18n = ({
  router,
  config: { cookieDomain, debug, secure },
}: I18nSettings) => {
  router.use(handler({ cookieDomain, debug, secure }));
  router.use(replaceTranslate);
};

export { setI18n };
