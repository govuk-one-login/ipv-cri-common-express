const path = require('path');
const express = require('express');
const config = require('../lib/config');

const middleware = ({
    urls = {public: '/public', publicImages: '/public/images'},
    publicDirs = ['public'],
    publicImagesDirs = ['assets/images'],
    public: publicOptions = { maxAge: 86400000 },
} = {}) => {
    const router = express.Router();

    publicDirs.forEach(dir => router.use(
        urls.public,
        express.static(
            path.resolve(config.get('APP_ROOT'), dir),
            publicOptions)));

    publicImagesDirs.forEach(dir => router.use(
        urls.publicImages,
        express.static(
            path.resolve(config.get('APP_ROOT'), dir),
            publicOptions)));

    router.use(
        urls.publicImages,
        express.static(
            path.resolve(path.dirname(require.resolve('hmpo-components')), 'assets', 'images'),
            publicOptions));

    router.use(
        urls.public,
        express.static(
            path.resolve(path.dirname(require.resolve('govuk-frontend')), 'assets'),
            publicOptions));

    return router;
};

module.exports = {
    middleware
};
