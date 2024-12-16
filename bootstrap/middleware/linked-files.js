const debug = require('debug')('hmpo:linked-files');
const redis = require('../lib/redis-client');
const onFinished = require('on-finished');
const uuid = require('../lib/uuid');
const async = require('async');

// redis records are stored as the uuid prefixed with this:
const PREFIX = 'file:';

// the value is prefixed with J:, B:, or S: to indicate JSON, Buffer, or String
function stringify(data) {
    if (typeof data === 'string') return 'S:' + data;
    if (Buffer.isBuffer(data)) return 'B:' + data.toString('base64');
    return 'J:' + JSON.stringify(data);
}

function parse(data, cb) {
    try {
        let type = data.charAt(0);
        data = data.substr(2);
        if (type === 'B') data = Buffer.from(data, 'base64');
        if (type === 'J') data = JSON.parse(data);
    } catch (e) {
        return cb(e);
    }
    cb(null, data);
}

const linkedFiles = {
    middleware: ({ ttl = 30000} = {}) => (req, res, next) => {
        req.linkedFiles = {
            add: (...args) => linkedFiles.add(req, ttl, ...args),
            get: (...args) => linkedFiles.get(req, ...args),
            del: (...args) => linkedFiles.del(req, ...args)
        };

        onFinished(res, () => {
            if (!req.session) return;
            let ids = Object.keys(req.session.linkedFiles || {});
            if (ids.length) {
                let client = redis.getClient();
                debug('Updated expiry date on linked files', ids);
                ids.forEach(id => client.expire(PREFIX + id, ttl));
            }
        });

        next();
    },

    injection(SessionInjection) {
        if (!SessionInjection.prototype.middlewareDecodePayload) {
            throw new Error('SessionInjection base class expected');
        }
        return class SessionInjectionWithLinkedFiles extends SessionInjection {
            middlewareDecodePayload(req, res, next) {
                super.middlewareDecodePayload(req, res, err => {
                    if (err) return next(err);

                    if (!req.payload || !req.payload.files) return next();

                    req.payload.journeyKeys = req.payload.journeyKeys || {};

                    let files = req.payload.files;
                    delete req.payload.files;

                    async.forEachOf(files, (file, key, done) => {
                        linkedFiles.add(req, file, (err, id) => {
                            if (err) return done(err);
                            req.payload.journeyKeys[key] = id;
                            done();
                        });
                    }, next);
                });
            }
        };
    },

    add(req, ttl, data, cb) {
        let id = uuid.v4();
        data = stringify(data);
        redis.getClient().setex(PREFIX + id, ttl, data, err => {
            if (err) return cb(err);
            req.session.linkedFiles = req.session.linkedFiles || {};
            req.session.linkedFiles[id] = true;
            debug('Linked file added:', id, data.length);
            cb(null, id);
        });
    },

    // Should function should only be used when there is no access to the session to check owenership of the file
    getNoCheck(id, cb) {
        debug('Getting linked file:', id);
        redis.getClient().get(PREFIX + id, (err, data) => {
            if (err) return cb(err);
            parse(data, cb);
        });
    },

    get(req, id, cb) {
        if (!req.session.linkedFiles || !req.session.linkedFiles[id]) {
            return cb(new Error('Linked file id not found ' + id));
        }
        linkedFiles.getNoCheck(id, cb);
    },

    del(req, id, cb) {
        if (!req.session.linkedFiles || !req.session.linkedFiles[id]) {
            return cb(new Error('Linked file id not found ' + id));
        }
        debug('Linked file deleted:', id);
        delete req.session.linkedFiles[id];
        redis.getClient().del(PREFIX + id, cb);
    },
};

module.exports = linkedFiles;
