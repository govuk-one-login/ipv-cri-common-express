const healthcheck = require(APP_ROOT + '/middleware/healthcheck');
const os = require('os');

describe('healthcheck', () => {
    let req, res;
    let originalPmId = process.env.pm_id;

    beforeEach( () => {
        req = {
            path: '/healthcheck',
            url: '/healthcheck',
            connection: {
                remoteAddress: '127.0.0.1'
            }
        };
        res = {
            setHeader: sinon.stub(),
            status: sinon.stub(),
            json: sinon.stub()
        };
        res.setHeader.returns(res);
        res.status.returns(res);
        res.json.returns(res);
        sinon.stub(os, 'hostname').returns('myhostname');
        delete process.env.pm_id;
    });

    afterEach( () => {
        os.hostname.restore();
        if (originalPmId) {
            process.env.pm_id = originalPmId;
        } else {
            delete process.env.pm_id;
        }
    });

    it('should set Connection header to close', () => {
        healthcheck.middleware()(req, res);

        res.setHeader.should.have.been.calledWithExactly(
            'Connection', 'close');
    });

    it('should return a 200 status', () => {
        healthcheck.middleware()(req, res);

        res.status.should.have.been.calledWithExactly(200);
        res.json.should.have.been.calledWithExactly(sinon.match({
            appName: 'test',
            id: 'myhostname',
            uptime: sinon.match.number,
            version: '1.0.1',
            status: 'OK'
        }));
    });

    it('should run healthFn with status code information', () => {
        const healthFn = (result) => {
            result.error = {
                code: 'ERROR',
                message: 'An error'
            };
        };
        healthcheck.middleware({ healthFn })(req, res);

        res.status.should.have.been.calledWithExactly(500);
        res.json.should.have.been.calledWithExactly(sinon.match({
            appName: 'test',
            id: 'myhostname',
            uptime: sinon.match.number,
            version: '1.0.1',
            error: {
                code: 'ERROR',
                message: 'An error'
            },
            status: 'ERROR'
        }));
    });

    it('should run healthFn with status message information', () => {
        const healthFn = (result) => {
            result.error = {
                message: 'An error'
            };
        };
        healthcheck.middleware({ healthFn })(req, res);

        res.status.should.have.been.calledWithExactly(500);
        res.json.should.have.been.calledWithExactly(sinon.match({
            appName: 'test',
            id: 'myhostname',
            uptime: sinon.match.number,
            version: '1.0.1',
            error: {
                message: 'An error'
            },
            status: 'An error'
        }));
    });

    it('should run async healthFn with status information', (done) => {
        const healthFn = async () => {
            const error = new Error('An error');
            error.code = 'ERROR';
            throw error;
        };
        healthcheck.middleware({ healthFn })(req, res);
        setTimeout(() => {
            res.status.should.have.been.calledWithExactly(500);
            res.json.should.have.been.calledWithExactly(sinon.match({
                id: 'myhostname',
                uptime: sinon.match.number,
                version: '1.0.1',
                error: {
                    code: 'ERROR',
                    message: 'An error'
                },
                status: 'ERROR'
            }));
            done();
        });
    });

    it('should append pm id to id if present', () => {
        process.env.pm_id = '1';

        healthcheck.middleware()(req, res);

        res.json.should.have.been.calledWithExactly(sinon.match({
            id: 'myhostname-1'
        }));
    });
});
