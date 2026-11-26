# Lib

The lib folder contains a variety of Express middleware functions, designed to interact with the [Express App](https://expressjs.com/en/4x/api.html#app)s directly, or to work with the `req`/`res`/`next` pattern of [Express middleware](https://expressjs.com/en/guide/writing-middleware.html).

- [`i18next`](./i18next) - Express router module for configuring [i18next](https://www.i18next.com/) for use with CRI paths and templates
- [`custom-fetch`](./custom-fetch.js) - shared fetch() helper for calling the CRI private API, with support for [`x-forwarded-for`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) and `x-scenario-id` headers
- [`error-handling`](./error-handling.js) - global error handler configured to redirect to initial caller of CRI
- [`headers`](./headers.js) - patch for load balancer forwarding incorrect header value for `x-forwarded-proto`
- [`oauth`](./oauth.js) - helpers for adding OAuth properties to the session and building the OAuth redirect url
- [`redis`](./redis.js) - configuration for use of in-memory Redis instead of DynamoDB in local test environments
- [`scenario-headers`](./scenario-headers.js) - helpers for setting scenario headers, used in Wiremock browser tests
- [`user-ip-address`](./user-ip-address.js) - function to parse out IP from semicolon delimited [X-Forwarded-For header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
