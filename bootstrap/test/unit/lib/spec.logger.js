const hmpoLogger = require('hmpo-logger');
const logger = require(APP_ROOT + '/lib/logger');

describe('Logger', () => {

    beforeEach( () => {
        sinon.stub(hmpoLogger, 'config');
        sinon.stub(hmpoLogger, 'get').returns('logger instance');
        if (logger.get.restore) logger.get.restore();
    });

    afterEach( () => {
        hmpoLogger.config.restore();
        hmpoLogger.get.restore();
        LOGGER_RESET();
    });

    it('exports functions', () => {
        logger.should.be.a('function');
        logger.setup.should.be.a('function');
        logger.get.should.be.a('function');
        logger.get.should.equal(logger);
    });

    describe('setup', () => {
        it('configures logger from options', () => {
            logger.setup({ foo: 'bar'});
            hmpoLogger.config.should.have.been.calledWithExactly({ foo: 'bar' });
        });

        it('configures logger from config', () => {
            logger.setup();
            hmpoLogger.config.should.have.been.calledWithExactly({ console: true });
        });
    });

    describe('get', () => {
        it('returns a named logger', () => {
            logger.get('name');
            hmpoLogger.get.should.have.been.calledWithExactly('name', 2);
        });

        it('returns a default logger', () => {
            logger.get();
            hmpoLogger.get.should.have.been.calledWithExactly(':hmpo-app', 2);
        });
    });

});
