const hmpoLogger = require('hmpo-logger');
const config = require('./config');

const setup = (options = config.get('logs', {})) => hmpoLogger.config(options);

const get = (name, level = 1) => hmpoLogger.get(name || ':hmpo-app', ++level);

module.exports = Object.assign(get, {
    setup,
    get
});
