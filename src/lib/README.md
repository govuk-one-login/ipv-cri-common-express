# Lib

The lib folder contains a variety of Express middleware functions, designed to interact with the [Express App](https://expressjs.com/en/4x/api.html#app)s directly, or to work with the `req`/`res`/`next` pattern of [Express middleware](https://expressjs.com/en/guide/writing-middleware.html).

- [`i18next`](./i18next) - Express router module for configuring [i18next](https://www.i18next.com/) for use with CRI paths and templates
- [`axios`](./axios.js) - shared Axios client with support for [`x-forwarded-for`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) and `x-scenario-id` headers
- [`error-handling`](./error-handling.js) - global error handler configured to redirect to initial caller of CRI
- [`headers`](./headers.js) - patch for load balancer forwarding incorrect header value for `x-forwarded-proto`
- [`helmet`](./helmet.js) - default [Helmet](https://helmetjs.github.io/) configuration
- [`locals`](./locals.js) - helpers for assigning [res.local](https://expressjs.com/en/api.html#res.locals) values from [req.app](https://expressjs.com/en/api.html#req.app) settings
- [`oauth`](./oauth.js) - helpers for adding OAuth properties to the session and building the OAuth redirect url
- [`redis`](./redis.js) - CloudFoundry configuration for Redis
- [`scenario-headers`](./scenario-headers.js) - helpers for setting scenario headers, used in Wiremock browser tests
- [`settings`](./settings.js) - helpers for assigning [`req.app`](https://expressjs.com/en/api.html#req.app) values for later use with middleware
- [`user-ip-address`](./user-ip-address.js) - function to parse out IP from semicolon delimited [X-Forwarded-For header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
