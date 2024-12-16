
# hmpo-app forms framework bootstrap

## Usage

### Simple usage
```
const { setup } = require('hmpo-app');
const { router } = setup();

router.use('/', require('./routes/example'));

```

### Extended usage
```
const {
    setup,
    featureFlag,
    config,
    logger,
    redisClient,
    linkedFiles
} = require('hmpo-app');

const {
    app,
    staticRouter,
    router,
    errorRouter
} = setup({
    option: 'value'
});
```

See example app for more details


## `setup()`

- **`setup(options)`** Bootstrap the app. run this as early on as possible to init the logger before it is used.


### Returned object:

> - **`app`** the top-level express app
> - **`staticRouter`** an express router before session is initialised
> - **`router`** an express router after session is initialised
> - **`errorRouter`** an express router before the generic error handling used to handle custom errors

### Options object:

Any of these options (except for `config`) can also be specified in a config file. The options passed to `setup()` override the options loaded from config files.

> - **`config`** if `false` no config will be loaded
>     - **`APP_ROOT`**  override app root directory detection
>     - **`files`** = `'config/default(.json|.yaml|.yml)'`  array of config files to try to load. Missing files will fail silently.
>     - **`envVarName`** = `'HMPO_CONFIG'`  environment variable to parse to override config values.
>     - **`commandLineSwitch`** = `'-c'`  command line switch to load additional config files.
>     - **`merge`** = `true`  merge new config with config from previous calls to setup.

> - **`env`** = `NODE_ENV` environment variable or `'development'`  environment.

> - **`port`** = `3000`  port to bind to. If `false` the app will not listen to a port.
> - **`host`** = `'0.0.0.0'`  host to bind to.

> - **`logs`**  see *`hmpo-logger`* options passed to logger. See *`hmpo-logger`* for defaults. If `false` no logger is initialised.
> - **`requestLogging`** = `true`  enable request logging (excluding public static files).

> - **`redis`** if `false` redis is not initialised
>     - **`connectionString`** connection url used for connecting to a redis instance
>     - **`host`**  host name for connecting to a redis instance
>     - **`port`** = `6379`  port for connection to a redis instance
>     - **`...otherOptions`** any other options are passed to *`redis`*
>     - If neither `connectionString` or `host` and `port` are specified an in-memory redis is used

> - **`errors`** if `false` no error handler is set
>     - **`startUrl`** = `'/'`  url to redirect to if a deep page is accessed as a new browser. Can be a `function(req, res)`.
>     - **`pageNotFoundView`** = `'errors/page-not-found'`  view to render for page not found.
>     - **`sessionEndedView`** = `'errors/session-ended'`  view to render if session is not found/expired.
>     - **`defaultErrorView`** = `'errors/error'`  view to render for other errors.

> - `urls`
>     - **`public`** = `'/public'`  base URL for public static assets.
>     - **`publicImages`** = `'/public/images'`  base URL for public sttic images.
>     - **`version`** = `'/version'`  base URL for version endpoint, or `false` to disable.
>     - **`healthcheck`** = `'/healthcheck'`  base URL for healthcheck endpoint, or `false` to disable.

> - **`publicDirs`** = `['public']`  array of paths to mount on the public route, relative to `APP_ROOT`.
> - **`publicImagesDirs`** = `['assets/images']`  array of paths to mount on the public images route, relative to `APP_ROOT`.
> - **`publicOptions`** = `{maxAge: 86400000}`  options passed to the express static middleware.

> - **`views`** = `'views'`  array of view directories relative to `APP_ROOT`.
> - **`nunjucks`** options passed to *`nunjucks`* templatinng contructor, or `false` to disable
>     - **`dev`** = `env==='development'` run *`nunjucks`* in developer mode for more verbose errors.
>     - **`noCache`** = `env==='development'`  don't cache compiled template files.
>     - **`watch`** = `env==='development'`  watch for changes to template files.
>     - **`...otherOptions`** any other options are passed to *`nunjucks.configure`*

> - **`locales`** = `'.'`  array of locales base directories (containing a `'locales'` directory) relative to `APP_ROOT`.
> - **`translation`** options passed to *`hmpo-i18n`* translation library, or `false` to disable
>     - **`noCache`** = `env==='development'`  don't cache templated localisation strings.
>     - **`watch`** = `env==='development'`  watch for changes to localisation files.
>     - **`allowedLangs`** = `['en','cy']`  array of allowed languages.
>     - **`fallbackLang`** = `['en']`  array of languages to use if translation not found is current language.
>     - **`cookie`** = `{name: 'lang'}`  cookie settings to use to store current language.
>     - **`query`** = `'lang'`  query parameter to use to change language, or `false` to disable.
>     - **`...otherOptions`** any other options are passed to *`hmpo-i18n`*

> - **`modelOptions`** configuration for model options helper to be used with *`hmpo-model`*
>     - **`sessionIDHeader`** = `'X-SESSION-ID'`  session ID request header to pass through to models.
>     - **`scenarioIDHeader`** = `'X-SCENARIO-ID'`  stub scenario ID request header to pass through to models.

> - **`helmet`** configuration for [Helmet](https://helmetjs.github.io/), or `false` to only use frameguard and disable `x-powered-by`.  
> - **`disableCompression`** = `false`  disable compression middleware.

> - **`cookies`** configuration for cookie parsing middleware

## `featureFlag`

- **`getFlags(req)`** return all session and config feature flags
- **`isEnabled(flag, req)`** check if a feature flag is enabled in session or config
- **`isDisabled(flag, req)`** check if a feature flag is disabled in session or config
- **`redirectIfEnabled(flag, url)`** middleware to redirect if a flag is enabled
- **`redirectIfDisabled(flag, url)`** middleware to redirect if a flag is disabled
- **`routeIf(flag, handlerIf, handlerElse)`** middleware to run different handler depending on status of a feature flag

```
const { featureFlag } = require('hmpo-app');

const enabledMiddleware = (req, res, next) => res.send('flag enabled');
const disabledMiddleware = (req, res, next) => res.send('flag disabled');

router.use(featureFlag.routeIf('flagname', enabledMiddleware, disabledMiddleware));
```

## `config()`

- **`config(path, defaultIfUndefined)`** get a value from loaded config by dot separated path, or a default if not found or undefined. Id any part of the path is not found, the default will be returned.

```
const { config } = require('hmpo-app');
const value = config.get('config.path.string', 'default value');
```
## `logger()`

- **`logger(name)`** get a new logger with an optional name

```
const { logger } = require('hmpo-app');

const log = logger(':name');
log.info('log message', { req, err, other: 'metedata' });

// or

logger().info('log message', { req, err, other: 'metedata' });
```

## `redisClient()`

- **`redisClient()`** return redis client

```
const { redisClient } = require('hmpo-app');
redisClient().set('key', 'value');
```
