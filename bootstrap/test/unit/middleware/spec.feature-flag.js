const featureFlag = require(APP_ROOT + '/middleware/feature-flag');

describe('Feature Flag', () => {
    let options;
    let middleware;
    let req;
    let res;
    let next;

    beforeEach(() => {
        options = {
            featureFlags: {
                flagFromConfig: true
            }
        };

        req = {
            featureFlags: {
                enabledFlag: true,
                disabledFlag: false
            },
            session: {
                featureFlags: {
                    flagFromSession: true
                }
            }
        };

        res = require('hmpo-reqres').res();
        res.redirect = sinon.stub();
        next = sinon.stub();

        middleware = featureFlag.middleware(options);
    });

    describe('#middleware', () => {
        it('should copy options.featureFlags and session.featureFlags to req.featureFlags', () => {
            middleware(req, res, next);

            req.featureFlags.should.deep.equal({
                enabledFlag: true,
                disabledFlag: false,
                flagFromConfig: true,
                flagFromSession: true
            });
        });

        it('should ignore nonexistant feature flag sources', () => {
            middleware = featureFlag.middleware();
            delete req.featureFlags;
            delete req.session;

            middleware(req, res, next);

            req.featureFlags.should.deep.equal({});
        });

        it('should deep clone featureFlags', () => {
            middleware(req, res, next);

            req.featureFlags.should.not.equal(options.featureFlags);
            req.featureFlags.should.not.equal(req.session.featureFlags);
            req.featureFlags.flagFromConfig = false;
            options.featureFlags.flagFromConfig.should.be.true;
        });

        it('should keep existing object reference', () => {
            const originalFlags = { originalFlag: true };
            req.featureFlags = originalFlags;
            middleware(req, res, next);
            req.featureFlags.should.equal(originalFlags);
            req.featureFlags.originalFlag.should.be.true;
            req.featureFlags.flagFromConfig.should.be.true;
        });

        it('should set the res.locals.featureFlags object to the updated featureflags', () => {
            req.featureFlags = { originalFlag: true };
            middleware(req, res, next);
            res.locals.featureFlags.should.deep.equal({
                originalFlag: true,
                flagFromConfig: true,
                flagFromSession: true
            });
        });

        it('should call next with no arguments', () => {
            middleware(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });

    describe('#getFlags', () => {
        it('should return the current flags from the req', () => {
            featureFlag.getFlags(req).should.deep.equal({
                enabledFlag: true,
                disabledFlag: false,
            });
        });

        it('should return en empty object if there are no flags in the req', () => {
            delete req.featureFlags;
            featureFlag.getFlags(req).should.deep.equal({});
        });

        it('should not cache flag results', () => {
            req.featureFlags.varyingFlag = true;

            let flags = featureFlag.getFlags(req);
            flags.varyingFlag.should.equal(true);

            req.featureFlags.varyingFlag = false;

            flags = featureFlag.getFlags(req);
            flags.varyingFlag.should.equal(false);
        });
    });

    describe('#isEnabled', () => {
        it('should call getFlags to fetch the current flags from the req', () => {
            featureFlag.isEnabled('enabledFlag', req).should.be.true;
        });

        it('should be true with an enabled flag', () => {
            featureFlag.isEnabled('enabledFlag', req).should.be.true;
        });

        it('should be false with an disabled flag', () => {
            featureFlag.isEnabled('disabledFlag', req).should.be.false;
        });

        it('should be false with a non existing flag', () => {
            featureFlag.isEnabled('nonExistingFlag', req).should.be.false;
        });
    });

    describe('#isDisabled', () => {
        it('should be false with an enabled flag', () => {
            featureFlag.isDisabled('enabledFlag', req).should.be.false;
        });

        it('should be true with an disabled flag', () => {
            featureFlag.isDisabled('disabledFlag', req).should.be.true;
        });

        it('should be true with an non existing flag', () => {
            featureFlag.isDisabled('nonExistingFlag', req).should.be.true;
        });
    });

    describe('#redirectIfEnabled', () => {
        it('should redirect with an enabled flag', () => {
            middleware = featureFlag.redirectIfEnabled('enabledFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.have.been.calledWith('http://example.org');
        });

        it('should not call next with an enabled flag', () => {
            middleware = featureFlag.redirectIfEnabled('enabledFlag', 'http://example.org');
            middleware(req, res, next);
            next.should.not.have.been.called;
        });

        it('should not redirect with a disabled flag', () => {
            middleware = featureFlag.redirectIfEnabled('disabledFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.not.have.been.called;
        });

        it('should call next with a disabled flag', () => {
            middleware = featureFlag.redirectIfEnabled('disabledFlag', 'http://example.org');
            middleware(req, res, next);
            next.should.have.been.called;
        });

        it('should not redirect with a non existing flag', () => {
            middleware = featureFlag.redirectIfEnabled('nonExistingFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.not.have.been.called;
        });

        it('should call next with a non existing flag', () => {
            middleware = featureFlag.redirectIfEnabled('nonExistingFlag', 'http://example.org');
            middleware(req, res, next);
            next.should.have.been.called;
        });
    });

    describe('#redirectIfDisabled', () => {
        it('should not redirect with an enabled flag', () => {
            middleware = featureFlag.redirectIfDisabled('enabledFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.not.have.been.called;
        });

        it('should call next with an enabled flag', () => {
            middleware = featureFlag.redirectIfDisabled('enabledFlag', 'http://example.org');
            middleware(req, res, next);
            next.should.have.been.called;
        });

        it('should redirect with a disabled flag', () => {
            middleware = featureFlag.redirectIfDisabled('disabledFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.have.been.calledWith('http://example.org');
        });

        it('should not call next with a disabled flag', () => {
            middleware = featureFlag.redirectIfDisabled('disabledFlag', 'http://example.org');
            middleware(req, res, next);
            next.should.not.have.been.called;
        });

        it('should redirect with a non existing flag', () => {
            middleware = featureFlag.redirectIfDisabled('nonExistingFlag', 'http://example.org');
            middleware(req, res, next);
            res.redirect.should.have.been.called;
        });

        it('should not call next with a non existing flag', () => {
            middleware = featureFlag.redirectIfDisabled('nonExistingFlag', 'http://example.org');
            middleware(req, res, next);

            next.should.not.have.been.called;
        });
    });

    describe('#routeIfEnabled', () => {
        let ifMiddleware, elseMiddleware;

        beforeEach(() => {
            ifMiddleware = sinon.stub();
            elseMiddleware = sinon.stub();
        });

        it('should route to ifMiddleware with an enabled flag', () => {
            middleware = featureFlag.routeIf('enabledFlag', ifMiddleware, elseMiddleware);

            middleware(req, res, next);

            ifMiddleware.should.have.been.calledWithExactly(req, res, next);
            elseMiddleware.should.not.have.been.called;
        });

        it('should route to elseMiddleware with a disabled flag', () => {
            middleware = featureFlag.routeIf('disabledFlag', ifMiddleware, elseMiddleware);

            middleware(req, res, next);

            elseMiddleware.should.have.been.calledWithExactly(req, res, next);
            ifMiddleware.should.not.have.been.called;
        });

        it('should route to elseMiddleware with a non existing flag', () => {
            middleware = featureFlag.routeIf('nonExistingFlag', ifMiddleware, elseMiddleware);

            middleware(req, res, next);

            elseMiddleware.should.have.been.calledWithExactly(req, res, next);
            ifMiddleware.should.not.have.been.called;
        });

        it('should route to elseMiddleware with a no flag', () => {
            middleware = featureFlag.routeIf(undefined, ifMiddleware, elseMiddleware);

            middleware(req, res, next);

            elseMiddleware.should.have.been.calledWithExactly(req, res, next);
            ifMiddleware.should.not.have.been.called;
        });
    });
});
