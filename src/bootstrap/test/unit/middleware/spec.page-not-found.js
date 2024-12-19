const pageNotFound = require(APP_ROOT + '/middleware/page-not-found').middleware;

describe('Page Not Found', () => {

    let req, res, cb;

    beforeEach(() => {
        req = {};
        res = {};
        cb = sinon.stub();
    });

    describe('middleware', () => {
        it('exports a function with length 3', () => {
            pageNotFound().should.be.a('function');
            pageNotFound().length.should.equal(3);
        });

        it('called callback with an error', () => {
            pageNotFound()(req, res, cb);
            cb.should.have.been.calledOnce;
            cb.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
            const err = cb.getCall(0).args[0];
            err.message.should.equal('Page not found');
            err.code.should.equal('PAGE_NOT_FOUND');
            err.template.should.equal('errors/page-not-found');
            err.status.should.equal(404);
        });

        it('use custom error template view', () => {
            pageNotFound({ pageNotFoundView: 'test' })(req, res, cb);
            const err = cb.getCall(0).args[0];
            err.template.should.equal('test');
        });
    });

});

