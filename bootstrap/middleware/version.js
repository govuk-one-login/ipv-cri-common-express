const debug = require('debug')('hmpo-app:version');
const config = require('../lib/config');
const path = require('path');

const middleware = ({
    versionFile = 'version.json'
} = {}) => {
    let versionJSON = {};

    try {
        const filename = path.resolve(config.get('APP_ROOT'), versionFile);
        versionJSON = require(filename);
    } catch (err) {
        debug('Error loading version json file', err.message);
    }

    versionJSON.appName = config.get('APP_NAME'),
    versionJSON.appVersion = config.get('APP_VERSION'),
    versionJSON.nodeVersion = process.versions.node;
    versionJSON.featureFlags = config.get('featureFlags');

    return (req, res, next) => res.send(versionJSON);
};

module.exports = {
    middleware
};
