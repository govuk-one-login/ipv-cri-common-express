const nocache = require(APP_ROOT + '/middleware/nocache');

describe('No Cache', () => {
    it('exports a middleware function', () => {
        nocache.middleware().should.be.a('function');
        nocache.middleware().length.should.equal(3);
    });

    describe('middleware', () => {
        it('should set no cache headers', () => {
            let req = {
                path: '/a/path'
            };
            let res = {
                setHeader: sinon.stub()
            };
            let next = sinon.stub();

            nocache.middleware()(req, res, next);

            res.setHeader.should.have.been.called;
            res.setHeader.getCall(0).should.have.been.calledWithExactly('Surrogate-Control', 'no-store');
            res.setHeader.getCall(1).should.have.been.calledWithExactly('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader.getCall(2).should.have.been.calledWithExactly('Pragma', 'no-cache');
            res.setHeader.getCall(3).should.have.been.calledWithExactly('Expires', '0');

            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('should not set no cache headers for a public URL', () => {
            let req = {
                path: '/a/path/public/foo/bar'
            };
            let res = {
                setHeader: sinon.stub()
            };
            let next = sinon.stub();

            nocache.middleware({ publicPath: '/public' })(req, res, next);

            res.setHeader.should.not.have.been.called;
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

});
