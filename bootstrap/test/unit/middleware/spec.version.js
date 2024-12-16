const version = require(APP_ROOT + '/middleware/version');

describe('Version', () => {
    it('exports a middleware function', () => {
        version.middleware().should.be.a('function');
        version.middleware().length.should.equal(3);
    });

    describe('middleware', () => {
        let req, res, next;

        beforeEach(() => {
            req = {};
            res = {
                send: sinon.stub()
            };
            next = sinon.stub();
        });

        it('call res.send with the contents of version file and app name', () => {
            version.middleware()(req, res, next);

            res.send.should.have.been.calledOnce;
            res.send.should.have.been.calledWithExactly({
                version: '1.2.3',
                foo: 'bar',
                appName: 'test',
                appVersion: '1.0.1',
                nodeVersion: String(process.versions.node),
                featureFlags: { testFeature: true }
            });
        });

        it('should ignore version file if not found', () => {
            version.middleware({ versionFile: 'notfound.json' })(req, res, next);

            res.send.should.have.been.calledWithExactly({
                appName: 'test',
                appVersion: '1.0.1',
                nodeVersion: String(process.versions.node),
                featureFlags: { testFeature: true }
            });
        });

    });

});
