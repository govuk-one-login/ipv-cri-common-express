const nunjucks = require('nunjucks');
const { setup } = require(APP_ROOT + '/middleware/nunjucks');

describe('nunjucks middleware', () => {

    let app, nunjucksEnv;

    beforeEach( () => {
        app = {
            set: sinon.stub(),
            get: sinon.stub()
        };
        app.get.withArgs('dev').returns(true);

        sinon.stub(nunjucks, 'configure');
        nunjucksEnv = {};
        nunjucks.configure.returns(nunjucksEnv);
    });

    afterEach(() => {
        nunjucks.configure.restore();
    });

    it('should configure nunjucks with a default set of views and options', () => {
        setup(app);
        nunjucks.configure.should.have.been.calledWithExactly(
            [
                APP_ROOT + '/test/unit/fixtures/views',
                APP_ROOT + '/node_modules/hmpo-components/components',
                APP_ROOT + '/node_modules/govuk-frontend',
            ],
            {
                express: app,
                dev: true,
                noCache: true,
                watch: true
            }
        );
    });

    it('should filter out a view if not present', () => {
        setup(app, { views: [ 'views', 'not_found'] });
        nunjucks.configure.should.have.been.calledWithExactly(
            [
                APP_ROOT + '/test/unit/fixtures/views',
                APP_ROOT + '/node_modules/hmpo-components/components',
                APP_ROOT + '/node_modules/govuk-frontend',
            ],
            sinon.match.object
        );
    });

    it('should run in prod mode if dev flag not set', () => {
        app.get.withArgs('dev').returns(false);

        setup(app);
        nunjucks.configure.should.have.been.calledWithExactly(
            sinon.match.array,
            {
                express: app,
                dev: false,
                noCache: false,
                watch: false
            }
        );
    });

    it('should set the view engine value', () => {
        setup(app);
        app.set.should.have.been.calledWithExactly('view engine', 'html');
    });

    it('should set the view engine value', () => {
        const result = setup(app);
        result.should.equal(nunjucksEnv);
    });
});
