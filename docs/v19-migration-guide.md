# @govuk-one-login/di-ipv-cri-common-express: v19 migration guide

## Summary

Version 19 of Common Express makes a number of changes:

- Migration of the whole repository to ES Modules, and implementation of dual-syntax packaging using `tsc`, to enable continued compatibility with CJS-based consumers
- Removal of some dead code and unused dependencies
- Replacement of barrel files with a subpath-based scheme for importing components of the library

## Moved utilities

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

### `commonExpress.bootstrap`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/index.js`

#### Export names

| Before  | After      |
| ------- | ---------- |
| `setup` | `appSetup` |

### `commonExpress.bootstrap.config`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/config.js`

#### Export names

| Before         | After          |
| -------------- | -------------- |
| `[root]`       | `getConfig`    |
| `defaultFiles` | `defaultFiles` |
| `setup`        | `setupConfig`  |
| `get`          | `getConfig`    |

### `commonExpress.bootstrap.featureFlag`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/feature-flag.js`

#### Export names

| Before               | After                    |
| -------------------- | ------------------------ |
| `middleware`         | `featureFlagMiddleware`  |
| `getFlags`           | `getFlags`               |
| `isEnabled`          | `isFlagEnabled`          |
| `isDisabled`         | `isFlagDisabled`         |
| `redirectIfEnabled`  | `redirectIfFlagEnabled`  |
| `redirectIfDisabled` | `redirectIfFlagDisabled` |
| `routeIf`            | `routeIfFlagEnabled`     |

### `commonExpress.bootstrap.linkedFiles`

This utility was split across two files for ease of understanding and testing.

#### New paths

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/linked-files.js` (`linkedFilesMiddleware`)
`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/linked-files-utils.js` (`add`, `get` and `del` functions)

#### Export names

| Before       | After                   |
| ------------ | ----------------------- |
| `middleware` | `linkedFilesMiddleware` |
| `injection`  | N/A (removed as unused) |
| `add`        | `add`                   |
| `get`        | `get`                   |
| `del`        | `del`                   |

### `commonExpress.bootstrap.logger`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/logger.js`

#### Export names

| Before              | After               |
| ------------------- | ------------------- |
| `[root]`            | `getLogger`         |
| `setup`             | `setupLogger`       |
| `get`               | `getLogger`         |
| `redactQueryParams` | `redactQueryParams` |
| `logError`          | `logError`          |

### `commonExpress.bootstrap.redisClient`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/lib/redis-client.js`

#### Export names

| Before   | After              |
| -------- | ------------------ |
| `[root]` | `getRedisClient`   |
| `client` | `getRedisClient()` |
| `setup`  | `setupRedisClient` |
| `get`    | `getRedisClient`   |
| `close`  | `closeRedisClient` |

### `commonExpress.bootstrap.middleware`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/index.js`

#### Export names

| Before    | After                     |
| --------- | ------------------------- |
| `setup`   | `setupMiddlewares`        |
| `session` | `setupSessionMiddlewares` |
| `listen`  | `listen`                  |

### `commonExpress.bootstrap.nunjucks`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/nunjucks.js`

#### Export names

| Before  | After           |
| ------- | --------------- |
| `setup` | `setupNunjucks` |

### `commonExpress.bootstrap.translation`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/bootstrap/middleware/translation.js`

#### Export names

| Before  | After              |
| ------- | ------------------ |
| `setup` | `setupTranslation` |

### `commonExpress.lib.customFetch`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/custom-fetch.js`

#### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `customFetchMiddleware` | `customFetchMiddleware` |
| `CustomFetchHttpError`  | `CustomFetchHttpError`  |

### `commonExpress.lib.errorHandling`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/error-handling.js`

#### Export names

| Before                      | After                       |
| --------------------------- | --------------------------- |
| `redirectAsErrorToCallback` | `redirectAsErrorToCallback` |

### `commonExpress.lib.headers`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/headers.js`

#### Export names

| Before              | After               |
| ------------------- | ------------------- |
| `setProtocolHeader` | `setProtocolHeader` |

### `commonExpress.lib.helmet`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/helmet.js`

#### Export names

| Before   | After          |
| -------- | -------------- |
| `[root]` | `helmetConfig` |

### `commonExpress.lib.i18n`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/i18next/index.js`

#### Export names

| Before    | After                            |
| --------- | -------------------------------- |
| `setI18n` | `setI18n`                        |
| `i18next` | `import i18next from "i18next";` |

### `commonExpress.lib.locals`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/locals.js`

#### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `getGTM`                | `getGTM`                |
| `getAssetPath`          | `getAssetPath`          |
| `getLanguageToggle`     | `getLanguageToggle`     |
| `getDeviceIntelligence` | `getDeviceIntelligence` |

### `commonExpress.lib.oauth`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/oauth.js`

#### Export names

| Before                        | After                         |
| ----------------------------- | ----------------------------- |
| `addOAuthPropertiesToSession` | `addOAuthPropertiesToSession` |
| `buildRedirectUrl`            | `buildRedirectUrl`            |

### `commonExpress.lib.redis`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/redis.js`

#### Export names

| Before           | After            |
| ---------------- | ---------------- |
| `getRedisConfig` | `getRedisConfig` |

### `commonExpress.lib.scenarioHeaders`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/scenario-headers.js`

#### Export names

| Before              | After               |
| ------------------- | ------------------- |
| `setScenarioHeader` | `setScenarioHeader` |

### `commonExpress.lib.settings`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/lib/settings.js`

#### Export names

| Before                  | After                   |
| ----------------------- | ----------------------- |
| `setGTM`                | `setGTM`                |
| `setLanguageToggle`     | `setLanguageToggle`     |
| `setDeviceIntelligence` | `setDeviceIntelligence` |

### `commonExpress.routes.oauth2`

#### New path

`@govuk-one-login/di-ipv-cri-common-express/routes/oauth2/index.js`

#### Export names

| Before   | After          |
| -------- | -------------- |
| `[root]` | `oauth2Router` |
