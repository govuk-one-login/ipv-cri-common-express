const compatibility = require(APP_ROOT + '/middleware/compatibility');

describe('Compatibility', () => {
    it('exports a middleware function', () => {
        const fn = compatibility.middleware();
        fn.should.be.a('function').and.have.length(3);
    });

    describe('middleware', () => {

        it('should set compatibility header', () => {
            const fn = compatibility.middleware();
            const req = {};
            const res = {
                setHeader: sinon.stub()
            };
            const next = sinon.stub();

            fn(req, res, next);

            res.setHeader.should.have.been.calledWithExactly('X-UA-Compatible', 'IE=edge,chrome=1');

            next.should.have.been.calledOnce.and.calledWithExactly();
        });
    });

});
