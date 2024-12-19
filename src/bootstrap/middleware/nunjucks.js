const debug = require('debug')('hmpo-app:nunjucks');
const fs = require('fs');
const path = require('path');
const config = require('../lib/config');
const nunjucks = require('nunjucks');

const setup = (app, {
    views = 'views',
    ...otherOptions
} = {}) => {
    const isDevEnv = Boolean(app.get('dev'));
    const APP_ROOT = config.get('APP_ROOT');

    if (!Array.isArray(views)) views = [views];

    views = [
        ...views,
        path.resolve(path.dirname(require.resolve('hmpo-components')), 'components'),
        path.resolve(path.dirname(require.resolve('govuk-frontend')), '..'),
    ];

    views = views
        .map(dir => path.resolve(APP_ROOT, dir))
        .filter(dir => dir && fs.existsSync(dir));


    debug('Views', APP_ROOT, views);

    const nunjucksEnv = nunjucks.configure(views, {
        express: app,
        dev: isDevEnv,
        noCache: isDevEnv,
        watch: isDevEnv,
        ...otherOptions
    });

    app.set('view engine', 'html');
    app.set('nunjucks', nunjucksEnv);

    return nunjucksEnv;
};

module.exports = {
    setup
};
