const index = require(APP_ROOT);
const express = require('express');

describe('hmpo-app', () => {

    it('should export setup functions and libs', () => {
        index.should.contain.all.keys([
            'setup',
            'middleware',
            'config',
            'logger',
            'redisClient',
            'translation',
            'nunjucks',
            'linkedFiles',
            'featureFlag'
        ]);
    });

    describe('setup', () => {
        let app;

        beforeEach(() => {
            app = {
                use: sinon.stub(),
                get: sinon.stub()
            };
            sinon.stub(express, 'Router');
            express.Router.onCall(0).returns('staticRouter');
            express.Router.onCall(1).returns('router');
            express.Router.onCall(2).returns('errorRouter');
            sinon.stub(index.config, 'get');
            sinon.stub(index.config, 'setup');
            sinon.stub(index.logger, 'setup');
            sinon.stub(index.redisClient, 'setup');
            sinon.stub(index.middleware, 'setup').returns(app);
            sinon.stub(index.middleware, 'session');
            sinon.stub(index.middleware, 'errorHandler');
            sinon.stub(index.middleware, 'listen');
        });
        afterEach(() => {
            express.Router.restore();
            index.config.get.restore();
            index.config.setup.restore();
            index.logger.setup.restore();
            index.redisClient.setup.restore();
            index.middleware.setup.restore();
            index.middleware.session.restore();
            index.middleware.errorHandler.restore();
            index.middleware.listen.restore();
        });

        it('calls config.setup', () => {
            index.setup();
            index.config.setup.should.have.been.calledWithExactly(undefined);
        });

        it('calls config.setup with options', () => {
            index.setup({ config: { option: true} });
            index.config.setup.should.have.been.calledWithExactly({ option: true });
        });

        it('should not call config.setup if option is false', () => {
            index.setup({ config: false });
            index.config.setup.should.not.have.been.called;
        });

        it('calls logger.setup with options', () => {
            index.config.get.withArgs('logs').returns({ config: true });
            index.setup({ logs: { option: true } });
            index.logger.setup.should.have.been.calledWithExactly({
                option: true,
                config: true
            });
        });

        it('should not call logger.setup if option is false', () => {
            index.setup({ logs: false });
            index.logger.setup.should.not.have.been.called;
        });

        it('calls redisClient.setup with options', () => {
            index.config.get.withArgs('redis').returns({ config: true });
            index.setup({ redis: { option: true } });
            index.redisClient.setup.should.have.been.calledWithExactly({
                option: true,
                config: true
            });
        });

        it('should not call redisClient.setup if option is false', () => {
            index.setup({ redis: false });
            index.redisClient.setup.should.not.have.been.called;
        });

        it('calls middleware.setup with options', () => {
            index.config.get.withArgs().returns({ config: true });
            index.setup({ option: true });
            index.middleware.setup.should.have.been.calledWithExactly({
                option: true,
                config: true
            });
        });

        it('calls middleware.session with options', () => {
            index.config.get.withArgs('session').returns({ config: true });
            index.setup({ session: { option: true } });
            index.middleware.session.should.have.been.calledWithExactly(app, {
                option: true,
                config: true
            });
        });

        it('should not call middleware.session if option is false', () => {
            index.setup({ session: false });
            index.middleware.session.should.not.have.been.called;
        });


        it('calls middleware.errorHandler with options', () => {
            index.config.get.withArgs('errors').returns({ config: true });
            index.setup({ errors: { option: true } });
            index.middleware.errorHandler.should.have.been.calledWithExactly(app, {
                option: true,
                config: true
            });
        });

        it('should not call middleware.errorHandler if option is false', () => {
            index.setup({ errors: false });
            index.middleware.errorHandler.should.not.have.been.called;
        });

        it('should call middlewareSetupFn if option is defined', () => {
            const callbackStub = sinon.stub();
            index.setup({ middlewareSetupFn: callbackStub});
            callbackStub.should.have.been.called;
        });

        it('calls middleware.listen with options', () => {
            index.config.get.withArgs('host').returns('hostname');
            index.config.get.withArgs('port').returns(1234);
            index.setup({ port: 5678});
            index.middleware.listen.should.have.been.calledWithExactly(app, {
                port: 5678,
                host: 'hostname'
            });
        });

        it('should not call middleware.listen if port is false', () => {
            index.setup({ port: false });
            index.middleware.listen.should.not.have.been.called;
        });

        it('returns apps and routers', () => {
            const routers = index.setup();
            routers.should.eql({
                app,
                staticRouter: 'staticRouter',
                router: 'router',
                errorRouter: 'errorRouter'
            });
        });
    });

});
