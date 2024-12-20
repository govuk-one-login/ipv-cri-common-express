const middleware = require(APP_ROOT + '/middleware/error-handler').middleware;
const request = require('hmpo-reqres').req;

describe('Error Handler', () => {

    let req, res, next, errorhandler, loggerStub;

    beforeEach(() => {
        req = request({
            baseUrl: '/my-app',
            path: '/my-app/path',
            method: 'GET'
        });
        res = {
            render: sinon.stub(),
            redirect: sinon.stub(),
            locals: {
                backLink: '/back'
            }
        };
        next = sinon.stub();

        errorhandler = middleware({
            startUrl: '/start'
        });

        loggerStub = LOGGER_RESET();
    });

    describe('middleware', () => {
        it('exports a function with length 4 - express identifies error handling middleware by its arguments length', () => {
            errorhandler.should.be.a('function');
            errorhandler.length.should.equal(4);
        });

        describe('redirects', () => {

            it('redirect instead of showing error page if redirect is present in error', () => {
                const err = { redirect: '/redirect/location' };
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWithExactly('/redirect/location');
            });

            it('does redirect if on the POST of destination page', () => {
                req.path = '/redirect/location';
                req.method = 'POST';
                const err = { redirect: '/redirect/location' };
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWithExactly('/redirect/location');
            });

            it('does not redirect if on a GET of the destination page', () => {
                req.path = '/redirect/location';
                const err = { redirect: '/redirect/location' };
                errorhandler(err, req, res, next);
                res.redirect.should.not.have.been.called;
            });

        });

        describe('Back links', () => {

            let err;

            beforeEach(() => {
                err = {};
            });

            it('does not include a back link for SESSION_TIMEOUT errors', () => {
                err.code = 'SESSION_TIMEOUT';
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('errors/session-ended', sinon.match({ backLink: null }));
            });

            it('sets req.path as the back link for POSTs', () => {
                req.path = '/foo';
                req.method = 'POST';
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('errors/error', sinon.match({ backLink: '/foo' }));
            });

            it('sets res.locals.backLink as the back link for GETs', () => {
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('errors/error', sinon.match({ backLink: '/back' }));
            });

        });

        describe('Session timeout error', () => {

            let err;

            beforeEach(() => {
                err = {
                    code: 'SESSION_TIMEOUT'
                };
                req.path = '/payment';
                req.method = 'GET';
            });

            it('sets a default template and clears backlink', () => {
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('errors/session-ended', sinon.match({ backLink: null }));
            });

            it('doesn\'t overwrite a custom timeout template', () => {
                err.template = 'test/template';
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('test/template', sinon.match({ backLink: null }));
            });

            it('redirects to the base page if this is a new browser', () => {
                req.isNewBrowser = true;
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWith('/start');
                res.render.should.not.have.been.called;
            });

            it('redirects to a start page specified by a startUrl function', () => {
                req.isNewBrowser = true;
                res.locals = { htmlLang: 'cy' };
                errorhandler = middleware({
                    startUrl: (err, req, res) => res.locals.htmlLang === 'cy' ? '/welsh' : '/english'
                });
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWith('/welsh');
                res.render.should.not.have.been.called;
            });

            it('redirects to / if no startUrl is specified', () => {
                req.isNewBrowser = true;
                errorhandler = middleware();
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledWith('/');
            });

            it('doesn\'t redirect to the base page if a custom template is given', () => {
                req.isNewBrowser = true;
                err.template = 'test/template';
                errorhandler(err, req, res, next);
                res.redirect.should.not.have.been.called;
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('test/template', sinon.match({ backLink: null }));
            });

            it('sets the status code to 403', () => {
                errorhandler(err, req, res, next);
                res.statusCode.should.equal(403);
            });
        });

        describe('Missing prereq error', () => {

            let err;

            beforeEach(() => {
                err = {
                    code: 'MISSING_PREREQ'
                };
            });

            it('redirects to the start page if the error contains no redirect location', () => {
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWith('/start');
                res.render.should.not.have.been.called;
            });

            it('redirects to a specific location if given', () => {
                err.redirect = '/redirect/step';
                errorhandler(err, req, res, next);
                res.redirect.should.have.been.calledOnce;
                res.redirect.should.have.been.calledWith('/redirect/step');
                res.render.should.not.have.been.called;
            });

            it('shows error template if a custom template is given and no redirect location is specified', () => {
                err.template = 'test/template';
                errorhandler(err, req, res, next);
                res.redirect.should.not.have.been.called;
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('test/template');
            });

            it('sets the status code to 403', () => {
                err.template = 'test/template';
                errorhandler(err, req, res, next);
                res.statusCode.should.equal(403);
            });
        });

        describe('Generic error handling', () => {

            let err;

            beforeEach(() => {
                err = {};
            });

            it('sets a default template if no template is specified', () => {
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('errors/error', sinon.match({ backLink: '/back' }));
            });

            it('doesn\'t overwrite a custom template', () => {
                err.template = 'test/template';
                errorhandler(err, req, res, next);
                res.render.should.have.been.calledOnce;
                res.render.should.have.been.calledWith('test/template', sinon.match({ backLink: '/back' }));
            });

            it('should log the error if no template is specified', () => {
                loggerStub.error.reset();
                errorhandler(err, req, res, next);
                loggerStub.error.should.have.been.calledOnce;
                loggerStub.error.should.have.been.calledWithExactly(':clientip :verb :request :err.message', {req: req, err: err});
            });

            it('should not log the error if a template is specified', () => {
                err.template = 'test/template';
                loggerStub.error.reset();
                errorhandler(err, req, res, next);
                loggerStub.error.should.not.have.been.called;
            });

            it('should only log the error if the header has been sent', () => {
                res._headerSent = true;
                err.template = 'test/template';
                loggerStub.error.reset();
                errorhandler(err, req, res, next);
                loggerStub.error.should.have.been.calledOnce;
                loggerStub.error.should.have.been.calledWithExactly('Error after response: :clientip :verb :request :err.message', {req: req, err: err});
                res.render.should.not.have.been.called;
                next.should.not.have.been.called;
            });
        });
    });

});
