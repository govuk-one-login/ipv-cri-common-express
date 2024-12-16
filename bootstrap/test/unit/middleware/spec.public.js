const publicMiddleware = require(APP_ROOT + '/middleware/public').middleware;
const express = require('express');

describe('Public static assets', () => {

    let router;

    beforeEach(() => {
        router = {
            use: sinon.stub()
        };
        sinon.stub(express, 'Router').returns(router);
        sinon.stub(express, 'static').returns('static middleware');
    });

    afterEach(() => {
        express.Router.restore();
        express.static.restore();
    });

    describe('middleware', () => {
        it('creates and returns a router', () => {
            const router = publicMiddleware();
            express.Router.should.have.been.called;
            router.should.equal(router);
        });

        it('adds default public directories', () => {
            const router = publicMiddleware();

            express.static.should.have.callCount(4);
            router.use.should.have.callCount(4);

            router.use.getCall(0).should.have.been.calledWithExactly('/public', 'static middleware');
            express.static.getCall(0).should.have.been.calledWithExactly(
                APP_ROOT + '/test/unit/fixtures/public',
                { maxAge: 86400000 });

            router.use.getCall(1).should.have.been.calledWithExactly('/public/images', 'static middleware');
            express.static.getCall(1).should.have.been.calledWithExactly(
                APP_ROOT + '/test/unit/fixtures/assets/images',
                { maxAge: 86400000 });

            router.use.getCall(2).should.have.been.calledWithExactly('/public/images', 'static middleware');
            express.static.getCall(2).should.have.been.calledWithExactly(
                APP_ROOT + '/node_modules/hmpo-components/assets/images',
                { maxAge: 86400000 });

            router.use.getCall(3).should.have.been.calledWithExactly('/public', 'static middleware');
            express.static.getCall(3).should.have.been.calledWithExactly(
                APP_ROOT + '/node_modules/govuk-frontend/govuk/assets',
                { maxAge: 86400000 });

        });
    });

});
