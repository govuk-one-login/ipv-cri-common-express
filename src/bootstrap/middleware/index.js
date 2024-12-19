const path = require('path');
const express = require('express');
const logger = require('../lib/logger');

const requiredArgument = argName => {
    throw new Error(`Argument '${argName}' must be specified`);
};

const middleware = {
    setup({
        env = process.env.NODE_ENV,
        urls = {},
        featureFlags,
        publicDirs,
        publicImagesDirs,
        public: publicOptions,
        disableCompression = false,
        trustProxy = true,
        requestLogging = true,
        helmet,
        views,
        locales,
        nunjucks: nunjucksOptions,
        translation: translationOptions,
        modelOptions: modelOptionsConfig,
        cookies: cookieOptions
    } = {}) {
        const hmpoLogger = require('hmpo-logger');
        const healthcheck = require('./healthcheck');
        const modelOptions = require('./model-options');
        const featureFlag = require('./feature-flag');
        const version = require('./version');
        const cookies = require('./cookies');
        const bodyParser = require('body-parser');
        const translation = require('./translation');
        const hmpoComponents = require('hmpo-components');
        const publicMiddleware = require('./public');
        const nunjucks = require('./nunjucks');
        const headers = require('./headers');

        urls.public = urls.public || '/public';
        urls.publicImages = urls.publicImages || path.posix.join(urls.public, '/images');
        urls.version = urls.version === undefined ? '/version' : urls.version;
        urls.healthcheck = urls.healthcheck === undefined ? '/healthcheck' : urls.healthcheck;

        // create new express app
        const app = express();

        // environment
        env = (env || 'development').toLowerCase();
        app.set('env', env);
        app.set('dev', env !== 'production');

        // security and headers
        headers.setup(app, {
            disableCompression,
            trustProxy,
            publicPath: urls.public,
            helmet
        });

        // version, healthcheck
        if (urls.version) app.get(urls.version, version.middleware());
        if (urls.healthcheck) app.get(urls.healthcheck, healthcheck.middleware());

        // public static assets
        if (publicOptions !== false) app.use(publicMiddleware.middleware({
            urls,
            publicDirs,
            publicImagesDirs,
            public: publicOptions
        }));

        app.use(featureFlag.middleware({ featureFlags }));
        app.use(cookies.middleware(cookieOptions));
        app.use(modelOptions.middleware(modelOptionsConfig));
        app.use(bodyParser.urlencoded({ extended: true }));

        // logging
        if (requestLogging) app.use(hmpoLogger.middleware(':request'));

        Object.assign(app.locals, {
            baseUrl: '/',
            assetPath: urls.public,
            urls: urls
        });

        app.use((req, res, next) => {
            res.locals.baseUrl = req.baseUrl;
            next();
        });

        const nunjucksEnv = nunjucks.setup(app, { views, ...nunjucksOptions });
        translation.setup(app, { locales, ...translationOptions });
        hmpoComponents.setup(app, nunjucksEnv);

        return app;
    },

    session(app = requiredArgument('app'), sessionOptions) {
        const session = require('./session');
        const featureFlag = require('./feature-flag');
        const linkedFiles = require('./linked-files');

        app.use(session.middleware(sessionOptions));
        app.use(featureFlag.middleware());
        app.use(linkedFiles.middleware(sessionOptions));
    },

    errorHandler(app = requiredArgument('app'), errorHandleroptions) {
        const pageNotFound = require('./page-not-found');
        const errorHandler = require('./error-handler');

        app.use(pageNotFound.middleware(errorHandleroptions));
        app.use(errorHandler.middleware(errorHandleroptions));
    },

    listen(app = requiredArgument('app'), {
        port = 3000,
        host = '0.0.0.0'
    } = {}) {
        app.listen(port, host, () => {
            logger.get().info('Listening on http://:listen', {
                bind: host,
                port,
                listen: (host === '0.0.0.0' ? 'localhost' : host) + ':' + port });
        });
    },

};

module.exports = middleware;
