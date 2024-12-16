const redis = require('redis');
const logger = require('./logger');
const config = require('./config');

const setup = ({
    connectionString,
    host,
    port = 6379,
    ...redisOptions
} = config.get('redis', {})) => {
    const hostname = require('os').hostname().split('.')[0];
    const clientName = config.get('APP_NAME') + ':' + hostname + ':' + (process.env.pm_id || '0');
    const log = logger.get(':redis');

    if (redisClient.client) close();

    redisOptions.legacyMode = true;

    if (connectionString) {
        redisOptions.url = connectionString;
    }
    if (host && port) {
        redisOptions.socket = Object.assign({}, { host, port }, redisOptions.socket);
    }

    if (redisOptions.url || redisOptions.socket) {
        redisClient.client = redis.createClient(redisOptions);
    }

    if (redisClient.client) {
        redisClient.client.on('connect', () => {
            log.info('Connected to redis');
            redisClient.client.sendCommand('CLIENT', ['SETNAME', clientName]);
        });
        redisClient.client.on('reconnecting', () => {
            log.info('Reconnecting to redis');
        });
        redisClient.client.on('error', e => {
            log.error('Redis error', e);
        });

        redisClient.client.connect();
    }

    if (!redisClient.client) {
        log.info('Using In-memory Redis - sessions will be lost on restarts');
        const fakeRedis = require('fakeredis');
        redisClient.client = fakeRedis.createClient();

        redisClient.client.on('error', e => {
            log.error('Redis error', e);
        });
    }

    return redisClient.client;
};

const getClient = () => redisClient.client;

const close = (cb) => {
    if (!redisClient.client || !redisClient.client.connected) {
        redisClient.client = null;
        if (cb) cb();
        return;
    }

    if (cb) redisClient.client.once('end', cb);
    redisClient.client.quit();
    redisClient.client = null;
};

const redisClient = module.exports = Object.assign(getClient, {
    client: null,
    setup,
    getClient,
    close
});
