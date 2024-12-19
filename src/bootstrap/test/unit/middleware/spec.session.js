const session = require(APP_ROOT + '/middleware/session');
const redisClient = require(APP_ROOT + '/lib/redis-client');

describe('Session', () => {
    let redisStub;

    beforeEach( () => {
        redisStub = {
            on: sinon.stub()
        };
        sinon.stub(redisClient, 'getClient').returns(redisStub);
    });

    afterEach( () => {
        redisClient.getClient.restore();
    });

    it('exports an object of middleware', () => {
        session.should.be.an('object');
    });

    describe('session middleware', () => {
        it('should get the redis client', () => {
            session.middleware();
            redisClient.getClient.should.have.been.calledOnce;
        });

        it('should not create a redis session store if a store is specified', () => {
            const sessionStore = {
                on: sinon.stub()
            };
            session.middleware({ sessionStore });
            redisClient.getClient.should.not.have.been.called;
        });

        it('should return a new session store', () => {
            const middleware = session.middleware();
            middleware[0].should.be.a('function');
        });
    });

    describe('session locals', () => {
        let req, res, next, clock;

        beforeEach( () => {
            req = {
                session: {},
                cookies: {},
                sessionID: 'abc123'
            };
            res = {
                locals: {}
            };
            next = sinon.stub();
            clock = sinon.useFakeTimers(1234567890);
        });

        afterEach( () => {
            clock.restore();
        });

        it('should be a middleware function', () => {
            session.middleware()[1].should.be.a('function').and.have.length(3);
        });

        it('should set new browser flag to true if no sesssion cookie exists', () => {
            session.middleware()[1](req, res, next);

            req.isNewBrowser.should.be.true;
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('should set new browser flag to false if there is a session cookie', () => {
            req.cookies['hmpo.sid'] = 'foobar';

            session.middleware()[1](req, res, next);

            req.isNewBrowser.should.be.false;
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('should set the session start time', () => {
            session.middleware()[1](req, res, next);
            req.session['start-time'].should.equal(1234567890);
        });

        it('should set not overwrite an existing session start time', () => {
            req.session['start-time'] = 987654321;
            session.middleware()[1](req, res, next);
            req.session['start-time'].should.equal(987654321);
        });

        it('should set the session id to locals', () => {
            session.middleware()[1](req, res, next);
            res.locals.sessionid.should.equal('abc123');
        });
    });
});
