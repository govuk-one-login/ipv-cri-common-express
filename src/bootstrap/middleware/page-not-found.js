export const pageNotFoundMiddleware =
  ({ pageNotFoundView = "errors/page-not-found" } = {}) =>
  (req, res, next) => {
    const err = new Error("Page not found");
    err.code = "PAGE_NOT_FOUND";
    err.template = pageNotFoundView;
    err.status = 404;
    next(err);
  };
