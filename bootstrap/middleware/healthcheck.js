const nodeOS = require('os');
const config = require('../lib/config');

const middleware = ({
    healthFn
} = {}) => (req, res, next) => {
    let id = nodeOS.hostname();

    if (process.env.pm_id) {
        id += '-' + process.env.pm_id;
    }

    let status = {
        appName: config.get('APP_NAME'),
        version: config.get('APP_VERSION'),
        id: id,
        uptime: process.uptime()
    };

    const response = () => {
        status.status =
            status.status ||
            (status.error && status.error.code) ||
            (status.error && status.error.message) ||
            'OK';
        res.setHeader('Connection', 'close');
        res.status(status.status === 'OK' ? 200 : 500).json(status);
    };

    let promise;
    if (healthFn) promise = healthFn(status);
    if (promise instanceof Promise) {
        promise
            .catch(err => {
                status.error = {
                    message: err.message,
                    code: err.code
                };
            })
            .finally(response);
    } else {
        response();
    }
};

module.exports = {
    middleware
};
