const cookies = require(APP_ROOT + '/middleware/cookies');

describe('Cookies', () => {
    describe('middleware',  () => {
        let parser, fn, req, res, next, cookieStub;

        beforeEach( () => {
            [parser, fn] = cookies.middleware({ secret: 'abc123' });
            cookieStub = sinon.stub();
            req = {
                protocol: 'http'
            };
            res = {
                cookie: cookieStub
            };
            next = sinon.stub();
        });

        it('should create a cookie middleware', () => {
            parser.should.be.a('function').and.have.length(3);
            fn.should.be.a('function').and.have.length(3);
        });

        it('should default options to an empty object', () => {
            [parser, fn] = cookies.middleware();
            parser.should.be.a('function').and.have.length(3);
            fn.should.be.a('function').and.have.length(3);
        });

        it('should replace res.cookie with a function', () => {
            fn(req, res, next);
            res.cookie.should.not.equal(cookieStub);
        });

        it('should call the original res.cookie with secure values', () => {
            fn(req, res, next);
            res.cookie('name', 'value');
            cookieStub.should.have.been.calledOnce;
            cookieStub.should.have.been.calledWithExactly(
                'name',
                'value',
                {
                    secure: false,
                    httpOnly: true,
                    path: '/'
                }
            );
        });

        it('should set secure if the request was over https', () => {
            fn(req, res, next);
            req.protocol = 'https';
            res.cookie('name', 'value');
            cookieStub.should.have.been.calledOnce;
            cookieStub.should.have.been.calledWithExactly(
                'name',
                'value',
                {
                    secure: true,
                    httpOnly: true,
                    path: '/'
                }
            );
        });

        it('should extend and override supplied options', () => {
            fn(req, res, next);
            res.cookie('name', 'value', { expires: 'now', httpOnly: false });
            cookieStub.should.have.been.calledOnce;
            cookieStub.should.have.been.calledWithExactly(
                'name',
                'value',
                {
                    expires: 'now',
                    secure: false,
                    httpOnly: true,
                    path: '/'
                }
            );
        });

    });
});
