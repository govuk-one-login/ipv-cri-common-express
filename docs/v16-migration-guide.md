# @govuk-one-login/di-ipv-cri-common-express: v16 migration guide

## Summary

Version 16 of Common Express replaces the `req.axios` tool with a solution that
uses the JS-native `fetch()` API. This document provides guidance on how to
migrate from the former to the latter.

## Migration

### Express app middleware

Under the axios system, a middleware was used to attach an `Axios` instance to
the Express `req` object on each request. The given instance was configured with
a base URL and a number of interceptors that provided helpers for use cases such
as testing. The fetch-based utility works in the same way so should be a direct
replacement.

Change:

```js
// src/app.js

const commonExpress = require("@govuk-one-login/di-ipv-cri-common-express");
const axiosMiddleware = commonExpress.lib.axios;

// ...

app.use(axiosMiddleware);
```

to:

```js
// src/app.js

const commonExpress = require("@govuk-one-login/di-ipv-cri-common-express");
const { customFetchMiddleware } = commonExpress.lib.customFetch;

// ...

app.use(customFetchMiddleware);
```

With the middleware enabled, the fetch utility will be available at
`req.customFetch()`.

### Making requests

The tool can now be used to make requests in the application. The interface for
the `req.customFetch` function is broadly identical to
[that of the native fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch),
with a couple of small adjustments to replicate features that axios offered:

```typescript
function customFetch(
  path: string,
  // Standard Fetch API 'options' parameter, plus...
  options?: RequestInit & {
    // Timeout in milliseconds
    timeoutMs?: number;
    // object that will be serialised to JSON
    // automatically sets Content-Type: application/json if set
    jsonBody?: Record<string, unknown> | unknown[];
  },
): Promise<Response> /* Standard Fetch API Response object */ {}
```

#### Differences

There are some differences compared to axios:

- If an HTTP status code >= 400 is returned, CustomFetchHttpError is thrown.
  - CustomFetchHttpError stores data from the response at `error.code`,
    `error.headers` and `error.body` (as a string) for examination if necessary.
- The `customFetch` utility only allows calls against the configured base URL.
- Paths should always have a leading slash (`/some/path` ✅, `some/path` ❌).
- The response object is the standard Fetch API `Response` object. The response
  body should be extracted with `await response.text()` or
  `await response.json()` if needed.

#### Example: POST with timeout

Replace:

```js
const responseBody = await req.axios.post(
  "/some/api/path",
  { someBody: true },
  { headers: { "Some-Header": "hello" }, timeout: 5000 },
);
```

with:

```js
const response = await req.customFetch("/some/api/path", {
  method: "POST",
  headers: { "Some-Header": "hello" },
  jsonBody: { someBody: true },
  timeoutMs: 5000,
});

const responseBody = await response.json();
```

#### Example: Error handling

Replace:

```js
try {
  const response = await req.axios.get("/some/api/path");
} catch (error) {
  if (error.isAxiosError) {
    // handle the error
  }
}
```

with:

```js
const commonExpress = require("@govuk-one-login/di-ipv-cri-common-express");
const { CustomFetchHttpError } = commonExpress.lib.customFetch;

try {
  const response = await req.customFetch("/some/api/path");
} catch (error) {
  if (error instanceof CustomFetchHttpError) {
    // handle the error
  }
}
```

#### Example: Calling an external API

Replace:

```js
const responseBody = await req.axios.get("https://example.gov.uk/some/path");
```

with:

```js
// just use native fetch API directly
const response = await fetch("https://example.gov.uk/some/path");
const responseBody = await response.json();
```
