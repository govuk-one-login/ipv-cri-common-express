# SRC

The shared code in this repository is composed of:

- [bootstrap](./bootstrap) - Express app bootstrap, originally copied from [hmpo-app](https://github.com/HMPO/hmpo-app)
- [components](./components) - Nunjucks templates page layout and general components
- [lib](./lib) - Express middleware functions, designed to work using the `req`/`res`/`next` pattern of Express functions
- [routes](./routes) - standard OAuth routes, implementing a standard flow into and out of a CRI
