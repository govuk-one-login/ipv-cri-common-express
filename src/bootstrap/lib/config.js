const debug = require('debug')('hmpo-app:config');
const HmpoConfig = require('hmpo-config');

const defaultFiles = [
    'config/default.json',
    'config/default.yaml',
    'config/default.yml'
];
const setup = ({
    APP_ROOT,
    seed,
    files = defaultFiles,
    envVarName = 'HMPO_CONFIG',
    commandLineSwitch = '-c',
    merge = true,
    _commandLineArgs = process.argv,
    _environmentVariables = process.env
} = {}) => {
    const config = new HmpoConfig(APP_ROOT);

    if (seed) {
        debug('Merging with previous config');
        config.addConfig(seed);
    }

    if (!seed && merge && global.GLOBAL_CONFIG) {
        debug('Merging with previous config');
        config.addConfig(global.GLOBAL_CONFIG);
    }

    if (!seed && files) {
        debug('Adding files', files);
        files.forEach(file => config.addFile(file));
    }

    // load environment variable
    if (!seed && envVarName) {
        const envConfigText = _environmentVariables[envVarName];
        if (envConfigText) {
            debug('Adding env var', envVarName);
            config.addString(envConfigText);
        }
    }

    if (!seed && commandLineSwitch) {
        const args = _commandLineArgs.slice(2);
        while (args.length) {
            const arg = args.shift();
            if (arg === commandLineSwitch) {
                const filename = args.shift();
                debug('Adding command line file', filename);
                config.addFile(filename);
            }
        }
    }

    const configData = config.toJSON();

    // set timezone as early as possible
    if (configData.timezone) {
        _environmentVariables.TZ = configData.timezone;
    }

    global.GLOBAL_CONFIG = configData;
};

const get = (path, defaultIfUndefined) => {
    if (!global.GLOBAL_CONFIG) throw new Error('Config not loaded');
    if (!path) return global.GLOBAL_CONFIG;
    const value = path.split('.').reduce((obj, part) => obj && obj[part], global.GLOBAL_CONFIG);
    return value === undefined ? defaultIfUndefined : value;
};

module.exports = Object.assign(get, {
    defaultFiles,
    setup,
    get
});
