import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const testUuid = vi.hoisted(() => "abcd1234-5678-9012-3456-abcdef1234567890");
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue(testUuid),
}));
const redisStub = vi.hoisted(() => ({
  del: vi.fn((id, callback) => callback()),
  expire: vi.fn(),
  get: vi.fn((id, callback) => callback(null, "S:data")),
  setex: vi.fn((id, ttl, data, callback) => callback(null)),
}));
vi.mock("../../../src/bootstrap/lib/redis-client.js", () => ({
  getRedisClient: () => redisStub,
}));

import {
  get,
  del,
  add,
} from "../../../src/bootstrap/middleware/linked-files-utils.js";

describe("Linked Files", () => {
  let req;
  const cb = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    req = { session: {} };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should call callback with redis error", () => {
      let err = new Error();
      redisStub.setex.mockImplementationOnce((id, ttl, data, callback) =>
        callback(err),
      );
      add(req, 1800, "abc", cb);
      expect(cb).toHaveBeenCalledWith(err);
    });

    it("should add the data file into redis", () => {
      add(req, 1800, "abc", cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testUuid,
        1800,
        "S:abc",
        expect.any(Function),
      );
    });

    it("should add an object as JSON", () => {
      add(req, 1800, { foo: "bar" }, cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testUuid,
        1800,
        'J:{"foo":"bar"}',
        expect.any(Function),
      );
    });

    it("should add a buffer as base64", () => {
      add(req, 1800, Buffer.from("abcd", "ascii"), cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testUuid,
        1800,
        "B:YWJjZA==",
        expect.any(Function),
      );
    });

    it("should add id into the session file list", () => {
      add(req, 1800, "abc", cb);
      expect(req.session.linkedFiles).toHaveProperty(testUuid);
    });

    it("should call the callback with an id", () => {
      add(req, 1800, "abc", cb);
      expect(cb).toHaveBeenCalledWith(null, testUuid);
    });
  });

  describe("get", () => {
    it("should call callback with error if the id is not found", () => {
      get(req, testUuid, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call callback with redis error", () => {
      req.session.linkedFiles = { [testUuid]: true };
      let err = new Error();
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(err);
      });
      get(req, testUuid, cb);
      expect(cb).toHaveBeenCalledWith(err);
    });

    it("should get a string data file from redis by id", () => {
      req.session.linkedFiles = { [testUuid]: true };
      get(req, testUuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testUuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, "data");
    });

    it("should get a json data file from redis by id", () => {
      req.session.linkedFiles = { [testUuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, 'J:{"foo":"bar"}');
      });
      get(req, testUuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testUuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, { foo: "bar" });
    });

    it("should call callback with an error if the json is invalid", () => {
      req.session.linkedFiles = { [testUuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, 'J:{"foo":aaaaa}');
      });
      get(req, testUuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testUuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should get a buffer data file from redis by id", () => {
      req.session.linkedFiles = { [testUuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, "B:YWJjZA==");
      });
      get(req, testUuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testUuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, Buffer.from("abcd"));
    });
  });

  describe("del", () => {
    it("should call callback with error if the id is not found", () => {
      del(req, testUuid, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should get the data file from redis by id", () => {
      req.session.linkedFiles = { [testUuid]: true };
      del(req, testUuid, cb);
      expect(redisStub.del).toHaveBeenCalledWith(
        "file:" + testUuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalled();
    });

    it("should remove the linked file id from the session", () => {
      req.session.linkedFiles = { foo: true, [testUuid]: true };
      del(req, testUuid, cb);
      expect(req.session.linkedFiles).toEqual({ foo: true });
    });
  });
});
