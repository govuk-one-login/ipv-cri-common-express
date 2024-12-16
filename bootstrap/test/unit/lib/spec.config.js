const hmpoConfig = require('hmpo-config');
const config = require(APP_ROOT + '/lib/config');

describe('Config', () => {

    beforeEach( () => {
        sinon.stub(hmpoConfig.prototype, 'addConfig');
        sinon.stub(hmpoConfig.prototype, 'addFile');
        sinon.stub(hmpoConfig.prototype, 'addString');
        sinon.stub(hmpoConfig.prototype, 'toJSON').returns({ returned: 'config' });
        delete global.GLOBAL_CONFIG;
    });

    afterEach( () => {
        hmpoConfig.prototype.addConfig.restore();
        hmpoConfig.prototype.addFile.restore();
        hmpoConfig.prototype.addString.restore();
        hmpoConfig.prototype.toJSON.restore();
        CONFIG_RESET();
    });

    it('exports functions', () => {
        config.should.be.a('function');
        config.setup.should.be.a('function');
        config.get.should.be.a('function');
        config.get.should.equal(config);
    });

    describe('setup', () => {
        it('loads config using defaults', () => {
            config.setup();

            hmpoConfig.prototype.addFile.should.have.been.calledThrice;
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('config/default.json');
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('config/default.yaml');
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('config/default.yml');
            hmpoConfig.prototype.addConfig.should.not.have.been.called;
            hmpoConfig.prototype.addString.should.not.have.been.called;

            global.GLOBAL_CONFIG.should.eql({ returned: 'config' });
        });

        it('loads config using specified files', () => {
            config.setup({ files: ['a.json', 'b.json']});

            hmpoConfig.prototype.addFile.should.have.been.calledTwice;
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('a.json');
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('b.json');
            hmpoConfig.prototype.addConfig.should.not.have.been.called;
            hmpoConfig.prototype.addString.should.not.have.been.called;

            global.GLOBAL_CONFIG.should.eql({ returned: 'config' });
        });

        it('merges config config using defaults', () => {
            config.setup();
            config.setup();

            hmpoConfig.prototype.addConfig.should.have.been.calledWithExactly({
                returned: 'config'
            });
        });

        it('configures using environment variables', () => {
            const env = {
                HMPO_CONFIG: '{ config: "string" }'
            };
            config.setup({ _environmentVariables: env });

            hmpoConfig.prototype.addString.should.have.been.calledWithExactly('{ config: "string" }');
        });

        it('configures using command line options', () => {
            const args = [
                'node', '.',
                '-a', 'blah',
                '-c', 'configfile.json',
                '-c', 'configfile.yaml'
            ];
            config.setup({ _commandLineArgs: args });

            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('configfile.json');
            hmpoConfig.prototype.addFile.should.have.been.calledWithExactly('configfile.yaml');
        });

        it('sets the timezone if specified in config', () => {
            const env = {};
            hmpoConfig.prototype.toJSON.returns({ timezone: 'BST' });
            config.setup({ _environmentVariables: env });

            env.TZ.should.equal('BST');
        });
    });

    describe('get', () => {
        it('throws an error if no config is loaded', () => {
            expect(() => config.get('key')).to.throw();
        });

        it('returns a value from config', () => {
            global.GLOBAL_CONFIG = { key: 'value' };
            const result = config.get('key');
            result.should.equal('value');
        });

        it('returns a deep value from config', () => {
            global.GLOBAL_CONFIG = { obj: { obj2: { key: 'value' } } };
            const result = config.get('obj.obj2.key');
            result.should.equal('value');
        });

        it('returns undefined if any part of the path is not found', () => {
            global.GLOBAL_CONFIG = { obj: { obj2: { key: 'value' } } };
            const result = config.get('obj.obj3.key');
            expect(result).to.be.undefined;
        });

        it('returns default value if any part of the path is not found', () => {
            global.GLOBAL_CONFIG = { obj: { obj2: { key: 'value' } } };
            const result = config.get('obj.obj3.key', 'default');
            result.should.equal('default');
        });

        it('returns config root with no path specified', () => {
            global.GLOBAL_CONFIG = { obj: { obj2: { key: 'value' } } };
            const result = config.get();
            result.should.equal(global.GLOBAL_CONFIG);
        });

    });

});
