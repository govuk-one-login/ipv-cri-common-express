const redisClient = require(APP_ROOT + '/lib/redis-client');
const linkedFiles = require(APP_ROOT + '/middleware/linked-files');
const uuid = require(APP_ROOT + '/lib/uuid');

const testuuid = 'abcd1234-5678-9012-3456-abcdef1234567890';

describe('Linked Files', () => {
    let redisStub;
    let res;
    let req;
    let next;
    let cb;

    beforeEach( () => {
        redisStub = {
            del: sinon.stub().yields(),
            expire: sinon.stub(),
            get: sinon.stub().yields(null, 'S:data'),
            setex: sinon.stub().yields(null)
        };
        sinon.stub(redisClient, 'getClient').returns(redisStub);
        sinon.stub(uuid, 'v4').returns(testuuid);
        req = { session: {} };
        res = {
            finished: true,
            statusCode: 200
        };
        next = sinon.stub();
        cb = sinon.stub();
    });

    afterEach( () => {
        redisClient.getClient.restore();
        uuid.v4.restore();
    });

    it('exports an object of middleware', () => {
        linkedFiles.should.be.an('object');
    });

    describe('add', () => {
        it('should call callback with redis error', () => {
            let err = new Error();
            redisStub.setex.yields(err);
            linkedFiles.add(req, 1800, 'abc', cb);
            cb.should.have.been.calledWithExactly(err);
        });

        it('should add the data file into redis', () => {
            linkedFiles.add(req, 1800, 'abc', cb);
            redisStub.setex.should.have.been.calledWithExactly(
                'file:' + testuuid,
                1800,
                'S:abc',
                sinon.match.func);
        });

        it('should add an object as JSON', () => {
            linkedFiles.add(req, 1800, {foo: 'bar'}, cb);
            redisStub.setex.should.have.been.calledWithExactly(
                'file:' + testuuid,
                1800,
                'J:{"foo":"bar"}',
                sinon.match.func);
        });

        it('should add a buffer as base64', () => {
            linkedFiles.add(req, 1800, Buffer.from('abcd', 'ascii'), cb);
            redisStub.setex.should.have.been.calledWithExactly(
                'file:' + testuuid,
                1800,
                'B:YWJjZA==',
                sinon.match.func);
        });

        it('should add id into the session file list', () => {
            linkedFiles.add(req, 1800, 'abc', cb);
            req.session.linkedFiles.should.contain.key(
                testuuid
            );
        });

        it('should call the callback with an id', () => {
            linkedFiles.add(req, 1800, 'abc', cb);
            cb.should.have.been.calledWithExactly(
                null,
                testuuid
            );
        });
    });

    describe('get', () => {
        it('should call callback with error if the id is not found', () => {
            linkedFiles.get(req, testuuid, cb);
            cb.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('should call callback with redis error', () => {
            req.session.linkedFiles = { [testuuid]: true };
            let err = new Error();
            redisStub.get.yields(err);
            linkedFiles.get(req, testuuid, cb);
            cb.should.have.been.calledWithExactly(err);
        });

        it('should get a string data file from redis by id', () => {
            req.session.linkedFiles = { [testuuid]: true };
            linkedFiles.get(req, testuuid, cb);
            redisStub.get.should.have.been.calledWithExactly(
                'file:' + testuuid,
                sinon.match.func);
            cb.should.have.been.calledWithExactly(null, 'data');
        });

        it('should get a json data file from redis by id', () => {
            req.session.linkedFiles = { [testuuid]: true };
            redisStub.get.yields(null, 'J:{"foo":"bar"}');
            linkedFiles.get(req, testuuid, cb);
            redisStub.get.should.have.been.calledWithExactly(
                'file:' + testuuid,
                sinon.match.func);
            cb.should.have.been.calledWithExactly(null, { foo: 'bar' });
        });

        it('should call callback with an error if the json is invalid', () => {
            req.session.linkedFiles = { [testuuid]: true };
            redisStub.get.yields(null, 'J:{"foo":aaaaa}');
            linkedFiles.get(req, testuuid, cb);
            redisStub.get.should.have.been.calledWithExactly(
                'file:' + testuuid,
                sinon.match.func);
            cb.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('should get a buffer data file from redis by id', () => {
            req.session.linkedFiles = { [testuuid]: true };
            redisStub.get.yields(null, 'B:YWJjZA==');
            linkedFiles.get(req, testuuid, cb);
            redisStub.get.should.have.been.calledWithExactly(
                'file:' + testuuid,
                sinon.match.func);
            cb.should.have.been.calledWithExactly(null, Buffer.from('abcd'));
        });
    });

    describe('del', () => {
        it('should call callback with error if the id is not found', () => {
            linkedFiles.del(req, testuuid, cb);
            cb.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('should get the data file from redis by id', () => {
            req.session.linkedFiles = { [testuuid]: true };
            linkedFiles.del(req, testuuid, cb);
            redisStub.del.should.have.been.calledWithExactly(
                'file:' + testuuid,
                sinon.match.func);
            cb.should.have.been.calledWithExactly();
        });

        it('should remove the linked file id from the session', () => {
            req.session.linkedFiles = { foo: true, [testuuid]: true };
            linkedFiles.del(req, testuuid, cb);
            req.session.linkedFiles = { foo: true };
        });
    });

    describe('middleware', () => {
        it('should be a function', () => {
            linkedFiles.middleware.should.be.a('function');
        });

        it('should call next', () => {
            linkedFiles.middleware()(req, res, next);
            next.should.have.been.calledWithExactly();
        });

        describe('should add curried functions into the req object', () => {
            beforeEach(() => {
                sinon.stub(linkedFiles, 'add');
                sinon.stub(linkedFiles, 'get');
                sinon.stub(linkedFiles, 'del');
                linkedFiles.middleware()(req, res, next);
            });

            afterEach(() => {
                linkedFiles.add.restore();
                linkedFiles.get.restore();
                linkedFiles.del.restore();
            });

            it('#add', () => {
                req.linkedFiles.add.should.be.a('function');
                req.linkedFiles.add('abcd', cb);
                linkedFiles.add.should.have.been.calledWithExactly(req, 30000, 'abcd', cb);
            });

            it('#get', () => {
                req.linkedFiles.get.should.be.a('function');
                req.linkedFiles.get(testuuid, cb);
                linkedFiles.get.should.have.been.calledWithExactly(req, testuuid, cb);
            });

            it('#del', () => {
                req.linkedFiles.del.should.be.a('function');
                req.linkedFiles.del(testuuid, cb);
                linkedFiles.del.should.have.been.calledWithExactly(req, testuuid, cb);
            });
        });

        it('should call redis expire for each file in the session', done => {
            req.session.linkedFiles = {
                '123': true,
                '456': true,
            };

            linkedFiles.middleware({ ttl: 1800 })(req, res, next);

            setImmediate( () => {
                redisStub.expire.should.have.been.calledTwice;
                redisStub.expire.should.have.been.calledWithExactly('file:123', 1800);
                redisStub.expire.should.have.been.calledWithExactly('file:456', 1800);
                done();
            });
        });

        it('should call not call expire if the session has been removed', done => {
            req.session.linkedFiles = {
                '123': true,
                '456': true,
            };

            linkedFiles.middleware({ ttl: 1800 })(req, res, next);

            delete req.session;

            setImmediate( () => {
                redisStub.expire.should.not.have.been.called;
                done();
            });
        });

        it('should not extend any expiry times if there are no linked files', done => {
            linkedFiles.middleware({ ttl: 1800 })(req, res, next);

            setImmediate( () => {
                redisStub.expire.should.not.have.been.called;
                done();
            });
        });
    });

    describe('injection', () => {
        let BaseClass;

        beforeEach(() => {
            BaseClass = class { middlewareDecodePayload() {} };
            sinon.stub(BaseClass.prototype, 'middlewareDecodePayload').yields();
        });

        it('should be a function', () => {
            linkedFiles.injection.should.be.a('function');
        });

        it('should throw an error if an invalid argument is passed', () => {
            let EmptyClass = class { };
            expect(() => linkedFiles.injection(EmptyClass)).to.throw();
        });

        it('should return an extended class', () => {
            let InjectionClass = linkedFiles.injection(BaseClass);
            let instance = new InjectionClass();

            InjectionClass.should.not.equal(BaseClass);
            instance.should.be.an.instanceOf(BaseClass);
        });

        describe('#middlewareDecodePayload', () => {
            let instance;

            beforeEach(() => {
                let InjectionClass = linkedFiles.injection(BaseClass);
                instance = new InjectionClass();
                sinon.stub(linkedFiles, 'add').yields(null, 'abc123');
            });

            afterEach(() => {
                linkedFiles.add.restore();
            });

            it('should call parent method', () => {
                instance.middlewareDecodePayload(req, res, next);

                BaseClass.prototype.middlewareDecodePayload.should.have.been.calledWithExactly(
                    req, res, sinon.match.func
                );
            });

            it('should call next with an error if parent returns an error', () => {
                let err = new Error();
                BaseClass.prototype.middlewareDecodePayload.yields(err);
                instance.middlewareDecodePayload(req, res, next);
                next.should.have.been.calledWithExactly(err);
            });

            it('should call next if no payload files are specified', () => {
                req.payload = {};
                instance.middlewareDecodePayload(req, res, next);
                next.should.have.been.calledWithExactly();
                linkedFiles.add.should.not.have.been.called;
            });

            it('should create payload.journeyKeys if it does not exist', () => {
                req.payload = {
                    files: {}
                };
                instance.middlewareDecodePayload(req, res, next);
                req.payload.journeyKeys.should.eql({});
            });

            it('should add each file specified in payload.files', () => {
                req.payload = {
                    files: {
                        first: 'testdata',
                        second: { json: 'data' }
                    }
                };
                instance.middlewareDecodePayload(req, res, next);
                linkedFiles.add.should.have.been.calledTwice;
                linkedFiles.add.should.have.been.calledWithExactly(
                    req, 'testdata', sinon.match.func
                );
                linkedFiles.add.should.have.been.calledWithExactly(
                    req, {json: 'data'}, sinon.match.func
                );
            });

            it('should add each reference into the journey keys', () => {
                req.payload = {
                    journeyKeys: { foo: 'bar' },
                    files: {
                        first: 'testdata',
                        second: { json: 'data' }
                    }
                };
                instance.middlewareDecodePayload(req, res, next);
                req.payload.journeyKeys.should.eql({
                    foo: 'bar',
                    first: 'abc123',
                    second: 'abc123'
                });
            });

            it('should call next with any linkedFiles error', () => {
                let err = new Error();
                linkedFiles.add.yields(err);
                req.payload = {
                    files: {
                        first: 'testdata',
                    }
                };
                instance.middlewareDecodePayload(req, res, next);
                next.should.have.been.calledWithExactly(err);
            });
        });
    });

});
