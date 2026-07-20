import { describe, vi, expect, beforeEach, afterEach, it } from "vitest";

const redis = require("redis");
const fakeredis = require("fakeredis");
const redisClient = require(APP_ROOT + "/src/bootstrap/lib/redis-client");

describe("Redis Client", () => {
  let redisStub, fakeredisStub, loggerStub;

  beforeEach(() => {
    redisStub = {
      connected: true,
      connect: vi.fn(),
      sendCommand: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      quit: vi.fn(),
    };
    fakeredisStub = { ...redisStub };

    vi.spyOn(redis, "createClient").mockReturnValue(redisStub);
    vi.spyOn(fakeredis, "createClient").mockReturnValue(fakeredisStub);
    redisClient.client = null;

    loggerStub = LOGGER_RESET();
  });

  afterEach(() => {
    redis.createClient.mockRestore();
    fakeredis.createClient.mockRestore();
  });

  it("exports functions", () => {
    expect(typeof redisClient).toBe("function");
    expect(redisClient.getClient).toEqual(redisClient);
    expect(typeof redisClient.setup).toBe("function");
    expect(typeof redisClient.close).toBe("function");
  });

  describe("setup", () => {
    it("creates a new redis client", () => {
      const client = redisClient.setup({ host: "abc123", port: 123 });
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        socket: {
          port: 123,
          host: "abc123",
        },
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(client).toEqual(redisStub);
      expect(redisClient.client).toEqual(client);
    });

    it("creates a new redis client using default port", () => {
      redisClient.setup({ host: "abc123" });
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        socket: {
          port: 6379,
          host: "abc123",
        },
      });
      expect(redisStub.connect).toHaveBeenCalled();
    });

    it("creates a new redis client with a connection string", () => {
      const client = redisClient.setup({
        connectionString: "user:pass@host:port",
      });
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(client).toEqual(redisStub);
      expect(redisClient.client).toEqual(client);
    });

    it("passes other redis options to redis", () => {
      redisClient.setup({
        connectionString: "user:pass@host:port",
        foo: "bar",
      });
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        foo: "bar",
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
    });

    it("reconnects to redis if there is an existing redis client", () => {
      redisClient.client = redisStub;
      const client = redisClient.setup({
        connectionString: "user:pass@host:port",
      });
      expect(redisStub.quit).toHaveBeenCalled();
      expect(redis.createClient).toHaveBeenCalledTimes(1);
      expect(redis.createClient).toHaveBeenCalledWith({
        legacyMode: true,
        url: "user:pass@host:port",
      });
      expect(redisStub.connect).toHaveBeenCalled();
      expect(redisClient.client).toEqual(client);
    });

    it("should log an error redis error event", () => {
      redisStub.on.mockImplementation((event, callback) => {
        if (event === "error") {
          callback(new Error());
        }
      });
      redisClient.setup({ connectionString: "user:pass@host:port" });
      expect(loggerStub.error).toHaveBeenCalled();
    });

    it("should handle connect events", () => {
      redisStub.on.mockImplementationOnce((event, callback) => {
        if (event === "connect") {
          callback();
        }
      });
      redisClient.setup({ connectionString: "user:pass@host:port" });
      expect(loggerStub.info).toHaveBeenCalled();
      expect(redisStub.sendCommand).toHaveBeenCalledWith("CLIENT", [
        "SETNAME",
        expect.any(String),
      ]);
    });

    it("should handle reconnect events", () => {
      redisStub.on.mockImplementation((event, callback) => {
        if (event === "reconnecting") {
          callback();
        }
      });
      redisClient.setup({ connectionString: "user:pass@host:port" });
      expect(loggerStub.info).toHaveBeenCalled();
    });

    it("should create a in-memory redis server with no connection details", () => {
      let client = redisClient.setup();

      expect(redis.createClient).not.toHaveBeenCalled();

      expect(fakeredis.createClient).toHaveBeenCalledTimes(1);
      expect(fakeredis.createClient).toHaveBeenCalledWith();

      expect(client).toEqual(fakeredisStub);
      expect(redisClient.client).toEqual(client);
    });

    it("should log an error fake redis error event", () => {
      redisStub.on.mockImplementationOnce((event, callback) => {
        if (event === "error") {
          callback(new Error());
        }
      });
      redisClient.setup();
      expect(loggerStub.error).toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("closes an existing connected client connection", () => {
      let cb = vi.fn();
      redisClient.client = redisStub;
      redisClient.close(cb);
      expect(redisStub.once).toHaveBeenCalledWith("end", cb);
      expect(redisStub.quit).toHaveBeenCalledWith();
      expect(redisClient.client).toBeNull();
    });

    it("calls the callback if the client is not connected", () => {
      let cb = vi.fn();
      redisStub.connected = false;
      redisClient.client = redisStub;
      redisClient.close(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClient.client).toBeNull();
    });

    it("calls the callback if there is no redis client", () => {
      let cb = vi.fn();
      redisClient.close(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClient.client).toBeNull();
    });

    it("does nothing if there is no redis client and no callback specified", () => {
      redisClient.close();
      expect(redisStub.quit).not.toHaveBeenCalled();
      expect(redisClient.client).toBeNull();
    });
  });

  describe("getClient", () => {
    it("should return the current client", () => {
      expect(redisClient.getClient()).toBeNull();
      expect(redisClient()).toBeNull();

      redisClient.setup();

      expect(redisClient.getClient()).toEqual(fakeredisStub);
      expect(redisClient.getClient()).toEqual(redisClient.client);
      expect(redisClient()).toEqual(redisClient.client);

      redisClient.close();

      expect(redisClient.getClient()).toBeNull();
      expect(redisClient()).toBeNull();
    });
  });
});
