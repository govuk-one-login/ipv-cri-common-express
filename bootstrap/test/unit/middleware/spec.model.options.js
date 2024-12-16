const modelOptions = require(APP_ROOT + '/middleware/model-options');

describe('Model options helper', () => {

    let req, res, next;

    beforeEach(() => {
        req = {
            sessionID: 'SESSION',
            session: {
                scenarioID: 'SCENARIO'
            }
        };
        res = {};
        next = sinon.stub();
    });

    describe('middleware', () => {
        it('exports a function with length 3', () => {
            modelOptions.middleware().should.be.a('function');
            modelOptions.middleware().should.have.a.lengthOf(3);
        });

        it('creates a modelOptions method in req', () => {
            modelOptions.middleware()(req, res, next);
            req.modelOptions.should.be.a('function');
        });

        it('calls next', () => {
            modelOptions.middleware()(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });

    describe('req.modelOptions', () => {
        it('returns model options', () => {
            modelOptions.middleware()(req, res, next);
            let options = req.modelOptions();
            options.should.deep.equal({
                headers: {
                    'X-SESSION-ID': 'SESSION',
                    'X-SCENARIO-ID': 'SCENARIO'
                },
                logging: {
                    req
                }
            });
        });

        it('merges passed options with generated options', () => {
            modelOptions.middleware({
                sessionIDHeader: 'HEADER1',
                scenarioIDHeader: 'HEADER2',
                foo: 'bar'
            })(req, res, next);
            let options = req.modelOptions({
                headers: { extra: 'value', 'X-SCENARIO-ID': 'other' },
                logging: { key: 'value'}
            });
            options.should.deep.equal({
                headers: {
                    'HEADER1': 'SESSION',
                    'HEADER2': 'SCENARIO',
                    'X-SCENARIO-ID': 'other',
                    extra: 'value'
                },
                logging: {
                    req,
                    key: 'value'
                },
                foo: 'bar'
            });
        });

    });
});

