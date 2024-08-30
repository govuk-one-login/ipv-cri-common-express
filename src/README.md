# SRC

The shared code in this repository is composed of:

- [assets](./assets) - static JavaScript initialising cookie settings and Google Analytics (UA4)
  - note: deprecated by [@govuk-one-login/frontend-analytics](https://www.npmjs.com/package/@govuk-one-login/frontend-analytics)
- [components](./components) - Nunjucks templates page layout and general components
- [lib](./lib) - Express middleware functions, designed to work using the `req`/`res`/`next` pattern of Express functions
- [routes](./routes) - standard OAuth routes, implementing a standard flow into and out of a CRI
