# @govuk-one-login/di-ipv-cri-common-express: v19 migration guide

## Summary

Version 19 of Common Express makes a number of changes:

- Migration of the whole repository to ES Modules, and implementation of dual-syntax packaging using `tsc`, to enable continued compatibility with CJS-based consumers
- Removal of some dead code (and related tests)
  - Client-side browser JS
    - This seems to have been replaced by updated files from `@govuk-one-login/frontend-analytics`, `@govuk-one-login/frontend-device-intelligence` and `govuk-frontend` in CRI frontends
  - Linked files `injection()` function
    - This seems to be a legacy utility from `hmpo-app` which we do not use in One Login
- Replacement of barrel files with a more transparent subpath-based scheme for importing components of the library
- Miscellaneous changes:
  - Updated `scripts/checkTranslations.js` with an [implementation](https://github.com/govuk-one-login/govuk-one-login-frontend/blob/main/packages/frontend-ui/scripts/checkTranslations.ts) from `@govuk-one-login/frontend-ui`
    - That script is not currently included with `frontend-ui` and adding it to the bundle would be non-trivial so this was the preferred approach for now
- Removal of unused dependencies
- Removal of `hmpo-logger`. [Pino](https://getpino.io) is now the only logger

## Breaking changes

An example PR with changes to update Check HMRC can be found at https://github.com/govuk-one-login/ipv-cri-check-hmrc-front/pull/616. Note that only one of the two commits on that PR is relevant for the Common Express migration.

The changes that need making are:

- Remove any reference to deprecated Common Express client scripts, such as `@govuk-one-login/di-ipv-cri-common-express/src/assets/javascript/analytics/ua/init.js`, from build scripts
- [Update any direct use of the logger](#logging)
- [Update Nunjucks template path](#nunjucks-templates)
- [Update imported JS functions/utilities using the guide below](#moved-js-functions)
- Optional: remove deprecated configuration
  - `uaEnabled`, `uaContainerId` (parameters for `setGTM()`)
  - `MAY_2025_REBRAND_ENABLED` (environment variable)
  - `USE_PINO_LOGGER` (environment variable)
  - `logs` (option for `appSetup()` and config key)

### Logging

`hmpo-logger` has been removed.

The `USE_PINO_LOGGER` environment variable no longer has any effect.

`setupLogger()` and the `logs` option for `appSetup()` have been removed as they only configured `hmpo-logger`.

Front log levels are controlled by the `LOG_LEVEL` environment variable (default `info`).

Loggers returned by `getLogger()` are always Pino loggers, which take structured metadata as the **first** argument and the message second. Old `hmpo-logger`-style calls will drop metadata and must be updated:

```js
// Before (hmpo-logger)
logger.info("API request", { path });

// After (Pino)
logger.info({ path }, "API request");
```

`getLogger()` no longer accepts a second `level` argument, and its default name is now the package name rather than `:hmpo-app`.

### Nunjucks templates

The adjusted packaging of the module now means that Nunjucks templates need to be imported slightly differently. The updated path to provide in `appSetup({ views: [] })` should be:

```js
// ESM
// import { fileURLToPath } from "node:url";
fileURLToPath(
  import.meta.resolve("@govuk-one-login/di-ipv-cri-common-express/components"),
);
```

```js
// CJS
require.resolve("@govuk-one-login/di-ipv-cri-common-express/components");
```

This replaces previous imports, which might have looked like:

```js
path.resolve(
  path.dirname(
    fileURLToPath(
      import.meta.resolve("@govuk-one-login/di-ipv-cri-common-express")
    )
    // or
    require.resolve("@govuk-one-login/di-ipv-cri-common-express")
  ),
  "components"
)
```

### Moved JS functions

Instead of importing utilities from Common Express like this:

```js
const commonExpress = require("@govuk-one-login/di-ipv-cri-common-express");
const { customFetchMiddleware } = commonExpress.lib.customFetch;
```

Utilities should now be imported like this:

```js
import { customFetchMiddleware } from "@govuk-one-login/di-ipv-cri-common-express/lib/custom-fetch.js";
```

The below sections enumerate all the utilities that were previously exported under the root `commonExpress` object. It's intended as a cheat sheet to use when migrating. In general, the pattern is:

```js
const { myThing } = commonExpress.thing.someChild;
// to
import { myThing } from "@govuk-one-login/di-ipv-cri-common-express/thing/some-child.js";
```

However, this cannot be relied upon universally because:

- Some utilities have been renamed to be more meaningful, eg `setup()` -> `setupConfig()`
- Not all directories matched the structure in the previously-exported `commonExpress` tree

#### `commonExpress.bootstrap`

The `setup` function calls functions that have been made asynchronous due to conditional `import()` calls. It is therefore now `async`, meaning it returns a promise and should generally be called using `await appSetup(...)`.

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/index.js`

##### Export names

| Before  | After                                  |
| ------- | -------------------------------------- |
| `setup` | `appSetup` (**now async** - see above) |

#### `commonExpress.bootstrap.config`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/config.js`

##### Export names

| Before         | After          |
| -------------- | -------------- |
| `[root]`       | `getConfig`    |
| `defaultFiles` | `defaultFiles` |
| `setup`        | `setupConfig`  |
| `get`          | `getConfig`    |

#### `commonExpress.bootstrap.featureFlag`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/feature-flag.js`

##### Export names

| Before               | After                    |
| -------------------- | ------------------------ |
| `middleware`         | `featureFlagMiddleware`  |
| `getFlags`           | `getFlags`               |
| `isEnabled`          | `isFlagEnabled`          |
| `isDisabled`         | `isFlagDisabled`         |
| `redirectIfEnabled`  | `redirectIfFlagEnabled`  |
| `redirectIfDisabled` | `redirectIfFlagDisabled` |
| `routeIf`            | `routeIfFlagEnabled`     |

#### `commonExpress.bootstrap.linkedFiles`

This utility was split across two files for ease of understanding and testing.

##### New paths

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/linked-files.js` (`linkedFilesMiddleware`)
`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/linked-files-utils.js` (`add`, `get` and `del` functions)

##### Export names

| Before       | After                   |
| ------------ | ----------------------- |
| `middleware` | `linkedFilesMiddleware` |
| `injection`  | N/A (removed as unused) |
| `add`        | `add`                   |
| `get`        | `get`                   |
| `del`        | `del`                   |

#### `commonExpress.bootstrap.logger`

The `setup` function has been removed. It was previously used to configure `hmpo-logger`, which has been replaced with
`pino`.

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/logger.js`

##### Export names

| Before              | After               |
| ------------------- | ------------------- |
| `[root]`            | `getLogger`         |
| `setup`             | N/A (removed)       |
| `get`               | `getLogger`         |
| `redactQueryParams` | `redactQueryParams` |
| `logError`          | `logError`          |

#### `commonExpress.bootstrap.redisClient`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/redis-client.js`

##### Export names

| Before   | After              |
| -------- | ------------------ |
| `[root]` | `getRedisClient`   |
| `client` | `getRedisClient()` |
| `setup`  | `setupRedisClient` |
| `get`    | `getRedisClient`   |
| `close`  | `closeRedisClient` |

#### `commonExpress.bootstrap.middleware`

The `setup` function conditionally imports the `hmpo-components` module, which now needs to be done asynchronously under ESM. It is therefore now `async`, meaning it returns a promise and should generally be called using `await setupMiddlewares(...)`.

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/index.js`

##### Export names

| Before    | After                                          |
| --------- | ---------------------------------------------- |
| `setup`   | `setupMiddlewares` (**now async** - see above) |
| `session` | `setupSessionMiddlewares`                      |
| `listen`  | `listen`                                       |

#### `commonExpress.bootstrap.nunjucks`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/nunjucks.js`

##### Export names

| Before  | After           |
| ------- | --------------- |
| `setup` | `setupNunjucks` |

#### `commonExpress.bootstrap.translation`

The `setup` function conditionally imports the `hmpo-i18n` module, which now needs to be done asynchronously under ESM. It is therefore now `async`, meaning it returns a promise and should generally be called using `await setupTranslation(...)`.

##### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/translation.js`

##### Export names

| Before  | After                                          |
| ------- | ---------------------------------------------- |
| `setup` | `setupTranslation` (**now async** - see above) |

#### `commonExpress.lib.csrf`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/csrf/index.js` (`buildCsrfMiddleware` and `CsrfError`)
`@govuk-one-login/di-ipv-cri-common-express/lib/csrf/token.js` (token utilities)

##### Export names

| Before             | After                 |
| ------------------ | --------------------- |
| `[root]`           | `buildCsrfMiddleware` |
| `CsrfError`        | `CsrfError`           |
| `create`           | `createCsrfToken`     |
| `verify`           | `verifyCsrfToken`     |
| `setSessionSecret` | `setSessionSecret`    |

#### `commonExpress.lib.customFetch`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/custom-fetch.js`

##### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `customFetchMiddleware` | `customFetchMiddleware` |
| `CustomFetchHttpError`  | `CustomFetchHttpError`  |

#### `commonExpress.lib.errorHandling`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/error-handling.js`

##### Export names

| Before                      | After                       |
| --------------------------- | --------------------------- |
| `redirectAsErrorToCallback` | `redirectAsErrorToCallback` |

#### `commonExpress.lib.headers`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/headers.js`

##### Export names

| Before   | After               |
| -------- | ------------------- |
| `[root]` | `setProtocolHeader` |

#### `commonExpress.lib.helmet`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/helmet.js`

##### Export names

| Before   | After          |
| -------- | -------------- |
| `[root]` | `helmetConfig` |

#### `commonExpress.lib.i18n`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/i18next/index.js`

##### Export names

| Before    | After                            |
| --------- | -------------------------------- |
| `setI18n` | `setI18n`                        |
| `i18next` | `import i18next from "i18next";` |

#### `commonExpress.lib.locals`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/locals.js`

##### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `getGTM`                | `getGTM`                |
| `getAssetPath`          | `getAssetPath`          |
| `getLanguageToggle`     | `getLanguageToggle`     |
| `getDeviceIntelligence` | `getDeviceIntelligence` |

#### `commonExpress.lib.oauth`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/oauth.js`

##### Export names

| Before                        | After                         |
| ----------------------------- | ----------------------------- |
| `addOAuthPropertiesToSession` | `addOAuthPropertiesToSession` |
| `buildRedirectUrl`            | `buildRedirectUrl`            |

#### `commonExpress.lib.redis`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/redis.js`

##### Export names

| Before   | After            |
| -------- | ---------------- |
| `[root]` | `getRedisConfig` |

#### `commonExpress.lib.scenarioHeaders`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/scenario-headers.js`

##### Export names

| Before   | After               |
| -------- | ------------------- |
| `[root]` | `setScenarioHeader` |

#### `commonExpress.lib.settings`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/settings.js`

##### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `setGTM`                | `setGTM`                |
| `setLanguageToggle`     | `setLanguageToggle`     |
| `setDeviceIntelligence` | `setDeviceIntelligence` |

#### `commonExpress.routes.oauth2`

##### New path

`@govuk-one-login/di-ipv-cri-common-express/routes/oauth2/index.js`

##### Export names

| Before   | After          |
| -------- | -------------- |
| `[root]` | `oauth2Router` |
