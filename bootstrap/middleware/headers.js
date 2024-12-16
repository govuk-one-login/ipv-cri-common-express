const helmetLib = require('helmet');
const nocache = require('./nocache');
const compatibility = require('./compatibility');
const compression = require('compression');

const setup = (app, {
    disableCompression = false,
    trustProxy = true,
    publicPath='/public',
    helmet
} = {}) => {

    // Security
    if (helmet) {
        app.use(helmetLib(helmet));
    } else {
        app.disable('x-powered-by');
        app.use(helmetLib.frameguard('sameorigin'));
    }

    // Headers
    app.set('trust proxy', trustProxy);
    app.use(nocache.middleware({ publicPath }));
    app.use(compatibility.middleware());
    if (!disableCompression) app.use(compression());
};

module.exports = {
    setup
};
