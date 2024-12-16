const proxyquire = require('proxyquire').noPreserveCache();

describe('headers middleware', () => {

    let app, middleware, stubs;

    beforeEach( () => {
        app = {
            disable: sinon.stub(),
            set: sinon.stub(),
            use: sinon.stub()
        };

        stubs = {
            compression: sinon.stub().returns('compression middleware'),
            nocache: {
                middleware: sinon.stub().returns('nocache middleware')
            },
            compatibility: {
                middleware: sinon.stub().returns('compatibility middleware')
            },
            helmet: sinon.stub()
        };

        stubs.helmet.frameguard = sinon.stub().returns('frameguard middleware');

        middleware = proxyquire(APP_ROOT + '/middleware/headers', {
            'compression': stubs.compression,
            './nocache': stubs.nocache,
            './compatibility': stubs.compatibility,
            'helmet': stubs.helmet
        });
    });

    context('headers', () => {
        it('should enable trust proxy by default', () => {
            middleware.setup(app);
            app.set.should.have.been.calledWithExactly('trust proxy', true);
        });

        it('should set trust proxy to config setting', () => {
            middleware.setup(app, { trustProxy: ['loopback', 'localunique']});
            app.set.should.have.been.calledWithExactly('trust proxy', ['loopback', 'localunique']);
        });

        it('should use the nocache middleware', () => {
            middleware.setup(app);
            stubs.nocache.middleware.should.have.been.calledWithExactly({
                publicPath: '/public'
            });
            app.use.should.have.been.calledWithExactly('nocache middleware');
        });

        it('should use the nocache middleware with options', () => {
            middleware.setup(app, { publicPath: '/static' });
            stubs.nocache.middleware.should.have.been.calledWithExactly({
                publicPath: '/static'
            });
            app.use.should.have.been.calledWithExactly('nocache middleware');
        });

        it('should use the returned compression middleware', () => {
            middleware.setup(app);
            stubs.compression.should.have.been.calledOnce;
            stubs.compression.should.have.been.calledWithExactly();
            app.use.should.have.been.calledWithExactly('compression middleware');
        });

        it('should not use the returned compression middleware if compression is disabled', () => {
            middleware.setup(app, { disableCompression: true });
            stubs.compression.should.not.have.been.called;
            app.use.should.not.have.been.calledWithExactly('compression middleware');
        });

        it('should use the compatibility middleware', () => {
            middleware.setup(app);
            stubs.compatibility.middleware.should.have.been.calledWithExactly();
            app.use.should.have.been.calledWithExactly('compatibility middleware');
        });
    });

    context('security', () => {
        describe('by default without helmet config', () => {
            it('should disable the x-powered-by header', () => {
                middleware.setup(app);
                app.disable.should.have.been.calledWithExactly('x-powered-by');
            });

            it('should use the returned frameguard middleware', () => {
                middleware.setup(app);

                stubs.helmet.frameguard.should.have.been.calledOnce;
                stubs.helmet.frameguard.should.have.been.calledWithExactly('sameorigin');
                app.use.should.have.been.calledWithExactly('frameguard middleware');
            });
        });

        describe('with helmet config', () => {
            let helmetConfig;

            beforeEach(() => {
                helmetConfig = {
                    contentSecurityPolicy: false
                };

            });

            it('should call helmet with config', () => {
                middleware.setup(app, { helmet: helmetConfig });

                expect(stubs.helmet).to.have.been.calledWithExactly(helmetConfig);
            });

            it('should not directly disable the x-powered-by header', () => {
                middleware.setup(app, { helmet: helmetConfig });

                app.disable.should.not.have.been.calledWithExactly('x-powered-by');
            });

            it('should not directly use the returned frameguard middleware', () => {
                middleware.setup(app, { helmet: helmetConfig });

                stubs.helmet.frameguard.should.not.have.been.called;
                app.use.should.not.have.been.calledWithExactly('frameguard middleware');
            });
        });
    });
});
