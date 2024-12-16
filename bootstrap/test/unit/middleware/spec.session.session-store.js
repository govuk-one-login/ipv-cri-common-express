const proxyquire = require('proxyquire');
const expressSession = sinon.stub();
const session = proxyquire(APP_ROOT + '/middleware/session', {
    'express-session': expressSession
});
const redisClient = require(APP_ROOT + '/lib/redis-client');

describe('Session', () => {
    let redisStub;

    beforeEach( () => {
        redisStub = {
            on: sinon.stub()
        };
        sinon.stub(redisClient, 'getClient').returns(redisStub);
        expressSession.reset();
    });

    afterEach( () => {
        redisClient.getClient.restore();
    });

    it('exports an object of middleware', () => {
        session.should.be.an('object');
    });

    describe('session middleware', () => {
        describe('session store', () => {
            let sessionStore;
            beforeEach(() => {
                sessionStore = {
                    on: sinon.stub()
                };

            });

            it('should be set with default properties', () => {
                session.middleware({sessionStore });

                expect(expressSession).to.have.been.calledWith({
                    store: sessionStore,
                    cookie: { secure: 'auto'},
                    key: 'hmpo.sid',
                    secret: 'not-secret',
                    resave: true,
                    saveUninitialized: true
                });
            });

            it('should allow override of cookie key', () => {
                session.middleware({cookieName: 'cookie-name', sessionStore });

                expect(expressSession).to.have.been.calledWith(sinon.match({
                    key: 'cookie-name',
                }));
            });

            it('should allow override of secret', () => {
                session.middleware({secret: 'very-secret', sessionStore });

                expect(expressSession).to.have.been.calledWith(sinon.match({
                    secret: 'very-secret',
                }));
            });

            context('with cookieOptions', () => {
                let cookieOptions;

                it('should add additional properties', () => {
                    cookieOptions = {
                        domain: '.example.com'
                    };

                    session.middleware({cookieOptions, sessionStore });

                    expect(expressSession).to.have.been.calledWith(sinon.match({
                        cookie: { domain: '.example.com'}
                    }));
                });

                it('should allow override of existing options', () => {
                    cookieOptions = {
                        secure: 'false'
                    };

                    session.middleware({cookieOptions, sessionStore });

                    expect(expressSession).to.have.been.calledWith(sinon.match({
                        cookie: { secure: 'false'}
                    }));
                });

                it('should not change properties unless overriden', () => {
                    cookieOptions = {
                        domain: '.example.com'
                    };

                    session.middleware({cookieOptions, sessionStore });

                    expect(expressSession).to.have.been.calledWith(sinon.match({
                        cookie: { secure: 'auto'}
                    }));
                });
            });
        });
    });
});
