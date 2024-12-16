const translation = require(APP_ROOT + '/middleware/translation');
const i18n = require('hmpo-i18n');

describe('translation middleware', () => {

    let app;

    beforeEach( () => {
        app = {
            get: sinon.stub()
        };
        app.get.withArgs('dev').returns(true);

        sinon.stub(i18n, 'middleware');
    });

    afterEach(() => {
        i18n.middleware.restore();
    });

    it('should use the i18n middleware specifying the app root as the baseDir', () => {
        translation.setup(app);
        i18n.middleware.should.have.been.calledWithExactly(app, {
            baseDir: [
                APP_ROOT + '/test/unit/fixtures',
                APP_ROOT + '/node_modules/hmpo-components'
            ],
            noCache: true,
            watch: true,
            allowedLangs: [ 'en', 'cy' ],
            cookie: { name: 'lang' },
            query: 'lang'
        });
    });

    it('should use the i18n middleware specifying a custom locales locations', () => {
        translation.setup(app, { locales: [ '.', './dir_not_found' ] });
        i18n.middleware.should.have.been.calledWithExactly(app, {
            baseDir: [
                APP_ROOT + '/test/unit/fixtures',
                APP_ROOT + '/node_modules/hmpo-components'
            ],
            noCache: true,
            watch: true,
            allowedLangs: [ 'en', 'cy' ],
            cookie: { name: 'lang' },
            query: 'lang'
        });
    });

    it('should use the i18n middleware specifying a custom allowed lang list', () => {
        translation.setup(app, { allowedLangs: [ 'fr' ] });
        i18n.middleware.should.have.been.calledWithExactly(app, sinon.match({
            allowedLangs: [ 'fr' ],
        }));
    });

    it('should use the i18n middleware specifying a custom cookie name', () => {
        translation.setup(app, { cookie: { name: 'mycookie'} });
        i18n.middleware.should.have.been.calledWithExactly(app, sinon.match({
            cookie: { name: 'mycookie' },
        }));
    });

    it('should use the i18n middleware specifying a custum query lang', () => {
        translation.setup(app, { query: 'test' });
        i18n.middleware.should.have.been.calledWithExactly(app, sinon.match({
            query: 'test',
        }));
    });

    it('should use the i18n middleware without dev flags in production', () => {
        app.get.withArgs('dev').returns(false);
        translation.setup(app);
        i18n.middleware.should.have.been.calledWithExactly(app, sinon.match({
            noCache: false,
            watch: false
        }));
    });
});
