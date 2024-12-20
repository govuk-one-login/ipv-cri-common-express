const redis = require('redis');
const fakeredis = require('fakeredis');
const redisClient = require(APP_ROOT + '/lib/redis-client');

describe('Redis Client', () => {
    let redisStub, fakeredisStub, loggerStub;

    beforeEach( () => {
        redisStub = {
            connected: true,
            connect: sinon.stub(),
            sendCommand: sinon.stub(),
            on: sinon.stub(),
            once: sinon.stub(),
            quit: sinon.stub()
        };
        fakeredisStub = { ...redisStub };

        sinon.stub(redis, 'createClient').returns(redisStub);
        sinon.stub(fakeredis, 'createClient').returns(fakeredisStub);
        redisClient.client = null;

        loggerStub = LOGGER_RESET();
    });

    afterEach( () => {
        redis.createClient.restore();
        fakeredis.createClient.restore();
    });

    it('exports functions', () => {
        redisClient.should.be.a('function');
        redisClient.getClient.should.equal(redisClient);
        redisClient.setup.should.be.a('function');
        redisClient.close.should.be.a('function');
    });

    describe('setup', () => {
        it('creates a new redis client', () => {
            const client = redisClient.setup({ host: 'abc123', port: 123 });
            redis.createClient.should.have.been.calledOnce;
            redis.createClient.should.have.been.calledWithExactly({
                legacyMode: true,
                socket: {
                    port: 123,
                    host: 'abc123'
                }
            });
            redisStub.connect.should.have.been.called;
            client.should.equal(redisStub);
            redisClient.client.should.equal(client);
        });

        it('creates a new redis client using default port', () => {
            redisClient.setup({ host: 'abc123' });
            redis.createClient.should.have.been.calledWithExactly({
                legacyMode: true,
                socket: {
                    port: 6379,
                    host: 'abc123'
                }
            });
            redisStub.connect.should.have.been.called;
        });

        it('creates a new redis client with a connection string', () => {
            const client = redisClient.setup({ connectionString: 'user:pass@host:port' });
            redis.createClient.should.have.been.calledOnce;
            redis.createClient.should.have.been.calledWithExactly({
                legacyMode: true,
                url: 'user:pass@host:port'
            });
            redisStub.connect.should.have.been.called;
            client.should.equal(redisStub);
            redisClient.client.should.equal(client);
        });

        it('passes other redis options to redis', () => {
            redisClient.setup({ connectionString: 'user:pass@host:port', foo: 'bar' });
            redis.createClient.should.have.been.calledWithExactly({
                legacyMode: true,
                foo: 'bar',
                url: 'user:pass@host:port'
            });
            redisStub.connect.should.have.been.called;
        });

        it('reconnects to redis if there is an existing redis client', () => {
            redisClient.client = redisStub;
            const client = redisClient.setup({ connectionString: 'user:pass@host:port' });
            redisStub.quit.should.have.been.called;
            redis.createClient.should.have.been.calledOnce;
            redis.createClient.should.have.been.calledWithExactly({
                legacyMode: true,
                url: 'user:pass@host:port'
            });
            redisStub.connect.should.have.been.called;
            redisClient.client.should.equal(client);
        });

        it('should log an error redis error event', () => {
            redisStub.on.withArgs('error').yields(new Error);
            redisClient.setup({ connectionString: 'user:pass@host:port' });
            loggerStub.error.should.have.been.called;
        });

        it('should handle connect events', () => {
            redisStub.on.withArgs('connect').yields();
            redisClient.setup({ connectionString: 'user:pass@host:port' });
            loggerStub.info.should.have.been.called;
            redisStub.sendCommand.should.have.been.calledWithExactly('CLIENT', ['SETNAME', sinon.match.string]);
        });

        it('should handle reconnect events', () => {
            redisStub.on.withArgs('reconnecting').yields();
            redisClient.setup({ connectionString: 'user:pass@host:port' });
            loggerStub.info.should.have.been.called;
        });

        it('should create a in-memory redis server with no connection details', () => {
            let client = redisClient.setup();

            redis.createClient.should.not.have.been.called;

            fakeredis.createClient.should.have.been.calledOnce;
            fakeredis.createClient.should.have.been.calledWithExactly();

            client.should.equal(fakeredisStub);
            redisClient.client.should.equal(client);
        });

        it('should log an error fake redis error event', () => {
            redisStub.on.withArgs('error').yields(new Error);
            redisClient.setup();
            loggerStub.error.should.have.been.called;
        });
    });


    describe('close', () => {
        it('closes an existing connected client connection', () => {
            let cb = sinon.stub();
            redisClient.client = redisStub;
            redisClient.close(cb);
            redisStub.once.should.have.been.calledWithExactly('end', cb);
            redisStub.quit.should.have.been.calledWithExactly();
            expect(redisClient.client).to.be.null;
        });

        it('calls the callback if the client is not connected', () => {
            let cb = sinon.stub();
            redisStub.connected = false;
            redisClient.client = redisStub;
            redisClient.close(cb);
            cb.should.have.been.calledOnce;
            redisStub.quit.should.not.have.been.called;
            expect(redisClient.client).to.be.null;
        });

        it('calls the callback if there is no redis client', () => {
            let cb = sinon.stub();
            redisClient.close(cb);
            cb.should.have.been.calledOnce;
            redisStub.quit.should.not.have.been.called;
            expect(redisClient.client).to.be.null;
        });

        it('does nothing if there is no redis client and no callback specified', () => {
            redisClient.close();
            redisStub.quit.should.not.have.been.called;
            expect(redisClient.client).to.be.null;
        });

    });

    describe('getClient', () => {
        it('should return the current client', () => {
            expect(redisClient.getClient()).to.be.null;
            expect(redisClient()).to.be.null;

            redisClient.setup();

            redisClient.getClient().should.equal(fakeredisStub);
            redisClient.getClient().should.equal(redisClient.client);
            redisClient().should.equal(redisClient.client);

            redisClient.close();

            expect(redisClient.getClient()).to.be.null;
            expect(redisClient()).to.be.null;
        });
    });

});
