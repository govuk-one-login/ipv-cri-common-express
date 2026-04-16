import type { RedisClientType, RedisClientOptions } from "redis";

import { hostname } from "os";
import redis from "redis";
// @ts-expect-error fakeredis provides no types
import fakeRedis from "fakeredis";
import * as logger from "./logger.js";
import * as config from "./config.js";

interface SetupOptions extends RedisClientOptions {
  connectionString?: string;
  host?: string;
  port?: number;
}

let client: ReturnType<typeof redis.createClient> | null = null;

const setup = (
  {
    connectionString,
    host,
    port = 6379,
    ...redisOptions
  }: SetupOptions = config.get("redis", {}) as SetupOptions,
) => {
  const clientName =
    config.get("APP_NAME") +
    ":" +
    hostname().split(".")[0] +
    ":" +
    (process.env.pm_id || "0");
  const log = logger.get(":redis");

  if (client) close();

  if (connectionString) {
    redisOptions.url = connectionString;
  }
  if (host && port) {
    redisOptions.socket = {
      ...{ host, port },
      ...redisOptions.socket,
    };
  }

  if (redisOptions.url || redisOptions.socket) {
    client = redis.createClient(redisOptions as RedisClientOptions);
  }

  if (client) {
    const c = client; // create an immutable binding for client to keep ts happy (non-null narrowing persists into cb)
    c.on("connect", () => {
      log.info("Connected to redis");
      c.sendCommand(["CLIENT", "SETNAME", clientName]);
    });
    c.on("reconnecting", () => {
      log.info("Reconnecting to redis");
    });
    c.on("error", (e) => {
      log.error("Redis error", e);
    });

    c.connect();
  }

  if (!client) {
    log.info("Using In-memory Redis - sessions will be lost on restarts");
    client = fakeRedis.createClient() as RedisClientType;

    client.on("error", (e) => {
      log.error("Redis error", e);
    });
  }

  return client;
};

const getClient = () => client;

const close = (cb?: () => void) => {
  if (!client?.isReady) {
    client = null;
    if (cb) cb();
    return;
  }

  client.quit().finally(() => {
    client = null;
    if (cb) cb();
  });
};

export { setup, getClient, close };
