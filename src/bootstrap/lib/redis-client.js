import redis from "redis";
import { getLogger } from "./logger.js";
import { getConfig } from "./config.js";
import fakeRedis from "fakeredis";
import { hostname as getHostname } from "node:os";

const redisClientStore = { client: null };

export const getRedisClient = () => redisClientStore.client;

export const setupRedisClient = (
  { connectionString, host, port = 6379, ...redisOptions } = getConfig(
    "redis",
    {},
  ),
) => {
  const hostname = getHostname().split(".")[0];
  const clientName =
    getConfig("APP_NAME") + ":" + hostname + ":" + (process.env.pm_id || "0");
  const log = getLogger(":redis");

  if (redisClientStore.client) closeRedisClient();

  redisOptions.legacyMode = true;

  if (connectionString) {
    redisOptions.url = connectionString;
  }
  if (host && port) {
    redisOptions.socket = {
      host,
      port,
      ...redisOptions.socket,
    };
  }

  if (redisOptions.url || redisOptions.socket) {
    redisClientStore.client = redis.createClient(redisOptions);
  }

  if (redisClientStore.client) {
    redisClientStore.client.on("connect", () => {
      log.info("Connected to redis");
      redisClientStore.client.sendCommand("CLIENT", ["SETNAME", clientName]);
    });
    redisClientStore.client.on("reconnecting", () => {
      log.info("Reconnecting to redis");
    });
    redisClientStore.client.on("error", (e) => {
      log.error("Redis error", e);
    });

    redisClientStore.client.connect();
  }

  if (!redisClientStore.client) {
    log.info("Using In-memory Redis - sessions will be lost on restarts");
    redisClientStore.client = fakeRedis.createClient();

    redisClientStore.client.on("error", (e) => {
      log.error("Redis error", e);
    });
  }

  return redisClientStore.client;
};

export const closeRedisClient = (cb) => {
  if (!redisClientStore.client?.connected) {
    redisClientStore.client = null;
    if (cb) cb();
    return;
  }

  if (cb) redisClientStore.client.once("end", cb);
  redisClientStore.client.quit();
  redisClientStore.client = null;
};
