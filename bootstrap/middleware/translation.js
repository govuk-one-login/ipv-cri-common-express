const debug = require('debug')('hmpo-app:translations');
const config = require('../lib/config');
const path = require('path');
const fs = require('fs');
const i18n = require('hmpo-i18n');

const setup = (app, {
    locales = '.',
    ...otherOptions
} = {}) => {
    const APP_ROOT = config.get('APP_ROOT');
    const isDevEnv = Boolean(app.get('dev'));

    if (!Array.isArray(locales)) locales = [locales];

    locales = [
        ...locales,
        path.dirname(require.resolve('hmpo-components'))
    ];

    locales = locales
        .map(dir => path.resolve(APP_ROOT, dir))
        .filter(dir => dir && fs.existsSync(dir));

    debug('Locales', APP_ROOT, locales);

    i18n.middleware(app, {
        baseDir: locales,
        noCache: isDevEnv,
        watch: isDevEnv,
        allowedLangs: [ 'en', 'cy'],
        cookie: { name: 'lang' },
        query: 'lang',
        ...otherOptions
    });
};

module.exports = {
    setup
};
