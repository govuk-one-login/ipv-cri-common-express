const chai = require('chai');
const resolve = require('path').resolve;
chai.use(require('sinon-chai'));

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');
global.APP_ROOT = resolve(__dirname, '..', '..');

global.CONFIG_RESET = () => {
    delete global.GLOBAL_CONFIG;
    const config = require(APP_ROOT + '/lib/config');
    config.setup({APP_ROOT: resolve(__dirname, 'fixtures'), seed: {
        APP_NAME: 'test',
        APP_VERSION: '1.0.1',
        featureFlags: { testFeature: true },
        logs: { console: true }
    } });
};

global.LOGGER_RESET = () => {
    const loggerStub = {
        info: sinon.stub(),
        error: sinon.stub(),
        warn: sinon.stub()
    };

    const logger = require(APP_ROOT + '/lib/logger');
    if (logger.get.restore) logger.get.restore();
    sinon.stub(logger, 'get').returns(loggerStub);

    return loggerStub;
};

CONFIG_RESET();
LOGGER_RESET();
