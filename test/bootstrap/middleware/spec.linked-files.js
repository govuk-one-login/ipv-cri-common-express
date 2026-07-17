import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const redisClient = require(APP_ROOT + "/src/bootstrap/lib/redis-client");
const linkedFiles = require(
  APP_ROOT + "/src/bootstrap/middleware/linked-files",
);
const uuid = require(APP_ROOT + "/src/bootstrap/lib/uuid");

const testuuid = "abcd1234-5678-9012-3456-abcdef1234567890";

describe("Linked Files", () => {
  let redisStub;
  let res;
  let req;
  let next;
  let cb;

  beforeEach(() => {
    vi.resetModules();
    redisStub = {
      del: vi.fn((id, callback) => callback()),
      expire: vi.fn(),
      get: vi.fn((id, callback) => callback(null, "S:data")),
      setex: vi.fn((id, ttl, data, callback) => callback(null)),
    };
    vi.spyOn(redisClient, "getClient").mockReturnValue(redisStub);
    vi.spyOn(uuid, "v4").mockReturnValue(testuuid);
    req = { session: {} };
    res = {
      finished: true,
      statusCode: 200,
    };
    next = vi.fn();
    cb = vi.fn();
  });

  afterEach(() => {
    redisClient.getClient.mockRestore();
    uuid.v4.mockRestore();
  });

  it("exports an object of middleware", () => {
    expect(typeof linkedFiles).toBe("object");
  });

  describe("add", () => {
    it("should call callback with redis error", () => {
      let err = new Error();
      redisStub.setex.mockImplementationOnce((id, ttl, data, callback) =>
        callback(err),
      );
      linkedFiles.add(req, 1800, "abc", cb);
      expect(cb).toHaveBeenCalledWith(err);
    });

    it("should add the data file into redis", () => {
      linkedFiles.add(req, 1800, "abc", cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testuuid,
        1800,
        "S:abc",
        expect.any(Function),
      );
    });

    it("should add an object as JSON", () => {
      linkedFiles.add(req, 1800, { foo: "bar" }, cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testuuid,
        1800,
        'J:{"foo":"bar"}',
        expect.any(Function),
      );
    });

    it("should add a buffer as base64", () => {
      linkedFiles.add(req, 1800, Buffer.from("abcd", "ascii"), cb);
      expect(redisStub.setex).toHaveBeenCalledWith(
        "file:" + testuuid,
        1800,
        "B:YWJjZA==",
        expect.any(Function),
      );
    });

    it("should add id into the session file list", () => {
      linkedFiles.add(req, 1800, "abc", cb);
      expect(req.session.linkedFiles).toHaveProperty(testuuid);
    });

    it("should call the callback with an id", () => {
      linkedFiles.add(req, 1800, "abc", cb);
      expect(cb).toHaveBeenCalledWith(null, testuuid);
    });
  });

  describe("get", () => {
    it("should call callback with error if the id is not found", () => {
      linkedFiles.get(req, testuuid, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call callback with redis error", () => {
      req.session.linkedFiles = { [testuuid]: true };
      let err = new Error();
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(err);
      });
      linkedFiles.get(req, testuuid, cb);
      expect(cb).toHaveBeenCalledWith(err);
    });

    it("should get a string data file from redis by id", () => {
      req.session.linkedFiles = { [testuuid]: true };
      linkedFiles.get(req, testuuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testuuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, "data");
    });

    it("should get a json data file from redis by id", () => {
      req.session.linkedFiles = { [testuuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, 'J:{"foo":"bar"}');
      });
      linkedFiles.get(req, testuuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testuuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, { foo: "bar" });
    });

    it("should call callback with an error if the json is invalid", () => {
      req.session.linkedFiles = { [testuuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, 'J:{"foo":aaaaa}');
      });
      linkedFiles.get(req, testuuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testuuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should get a buffer data file from redis by id", () => {
      req.session.linkedFiles = { [testuuid]: true };
      redisStub.get.mockImplementationOnce((id, callback) => {
        callback(null, "B:YWJjZA==");
      });
      linkedFiles.get(req, testuuid, cb);
      expect(redisStub.get).toHaveBeenCalledWith(
        "file:" + testuuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalledWith(null, Buffer.from("abcd"));
    });
  });

  describe("del", () => {
    it("should call callback with error if the id is not found", () => {
      linkedFiles.del(req, testuuid, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should get the data file from redis by id", () => {
      req.session.linkedFiles = { [testuuid]: true };
      linkedFiles.del(req, testuuid, cb);
      expect(redisStub.del).toHaveBeenCalledWith(
        "file:" + testuuid,
        expect.any(Function),
      );
      expect(cb).toHaveBeenCalled();
    });

    it("should remove the linked file id from the session", () => {
      req.session.linkedFiles = { foo: true, [testuuid]: true };
      linkedFiles.del(req, testuuid, cb);
      req.session.linkedFiles = { foo: true };
    });
  });

  describe("middleware", () => {
    it("should be a function", () => {
      expect(typeof linkedFiles.middleware).toBe("function");
    });

    it("should call next", () => {
      linkedFiles.middleware()(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    describe("should add curried functions into the req object", () => {
      beforeEach(() => {
        vi.spyOn(linkedFiles, "add");
        vi.spyOn(linkedFiles, "get");
        vi.spyOn(linkedFiles, "del");
        linkedFiles.middleware()(req, res, next);
      });

      afterEach(() => {
        linkedFiles.add.mockRestore();
        linkedFiles.get.mockRestore();
        linkedFiles.del.mockRestore();
      });

      it("#add", () => {
        expect(typeof req.linkedFiles.add).toBe("function");
        req.linkedFiles.add("abcd", cb);
        expect(linkedFiles.add).toHaveBeenCalledWith(req, 30000, "abcd", cb);
      });

      it("#get", () => {
        expect(typeof req.linkedFiles.get).toBe("function");
        req.linkedFiles.get(testuuid, cb);
        expect(linkedFiles.get).toHaveBeenCalledWith(req, testuuid, cb);
      });

      it("#del", () => {
        expect(typeof req.linkedFiles.del).toBe("function");
        req.linkedFiles.del(testuuid, cb);
        expect(linkedFiles.del).toHaveBeenCalledWith(req, testuuid, cb);
      });
    });

    it("should call redis expire for each file in the session", async () => {
      req.session.linkedFiles = {
        123: true,
        456: true,
      };

      linkedFiles.middleware({ ttl: 1800 })(req, res, next);

      await vi.waitFor(() => {
        expect(redisStub.expire).toHaveBeenCalledTimes(3);
      });
      expect(redisStub.expire).toHaveBeenCalledWith("file:123", 1800);
      expect(redisStub.expire).toHaveBeenCalledWith("file:456", 1800);
    });

    it("should call not call expire if the session has been removed", () => {
      req.session.linkedFiles = {
        123: true,
        456: true,
      };

      linkedFiles.middleware({ ttl: 1800 })(req, res, next);

      delete req.session;

      setImmediate(() => {
        expect(redisStub.expire).not.toHaveBeenCalled();
      });
    });

    it("should not extend any expiry times if there are no linked files", () => {
      linkedFiles.middleware({ ttl: 1800 })(req, res, next);

      setImmediate(() => {
        expect(redisStub.expire).not.toHaveBeenCalled();
      });
    });
  });

  describe("injection", () => {
    let BaseClass;

    beforeEach(() => {
      BaseClass = class {
        middlewareDecodePayload() {}
      };
      vi.spyOn(
        BaseClass.prototype,
        "middlewareDecodePayload",
      ).mockImplementation((req, res, callback) => {
        callback();
      });
    });

    it("should be a function", () => {
      expect(typeof linkedFiles.injection).toBe("function");
    });

    it("should throw an error if an invalid argument is passed", () => {
      let EmptyClass = class {};
      expect(() => linkedFiles.injection(EmptyClass)).toThrow(
        "SessionInjection base class expected",
      );
    });

    it("should return an extended class", () => {
      let InjectionClass = linkedFiles.injection(BaseClass);
      let instance = new InjectionClass();

      expect(InjectionClass).not.toEqual(BaseClass);
      expect(instance).toBeInstanceOf(BaseClass);
    });

    describe("#middlewareDecodePayload", () => {
      let instance;

      beforeEach(() => {
        let InjectionClass = linkedFiles.injection(BaseClass);
        instance = new InjectionClass();
        vi.spyOn(linkedFiles, "add").mockImplementation(
          (req, res, callback) => {
            callback(null, "abc123");
          },
        );
      });

      afterEach(() => {
        linkedFiles.add.mockRestore();
      });

      it("should call parent method", () => {
        instance.middlewareDecodePayload(req, res, next);

        expect(
          BaseClass.prototype.middlewareDecodePayload,
        ).toHaveBeenCalledWith(req, res, expect.any(Function));
      });

      it("should call next with an error if parent returns an error", () => {
        let err = new Error();
        BaseClass.prototype.middlewareDecodePayload.mockImplementation(
          (req, res, callback) => {
            callback(err);
          },
        );
        instance.middlewareDecodePayload(req, res, next);
        expect(next).toHaveBeenCalledWith(err);
      });

      it("should call next if no payload files are specified", () => {
        req.payload = {};
        instance.middlewareDecodePayload(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(linkedFiles.add).not.toHaveBeenCalled();
      });

      it("should create payload.journeyKeys if it does not exist", () => {
        req.payload = {
          files: {},
        };
        instance.middlewareDecodePayload(req, res, next);
        expect(req.payload.journeyKeys).toEqual({});
      });

      it("should add each file specified in payload.files", () => {
        req.payload = {
          files: {
            first: "testdata",
            second: { json: "data" },
          },
        };
        instance.middlewareDecodePayload(req, res, next);
        expect(linkedFiles.add).toHaveBeenCalledTimes(2);
        expect(linkedFiles.add).toHaveBeenCalledWith(
          req,
          "testdata",
          expect.any(Function),
        );
        expect(linkedFiles.add).toHaveBeenCalledWith(
          req,
          { json: "data" },
          expect.any(Function),
        );
      });

      it("should add each reference into the journey keys", () => {
        req.payload = {
          journeyKeys: { foo: "bar" },
          files: {
            first: "testdata",
            second: { json: "data" },
          },
        };
        instance.middlewareDecodePayload(req, res, next);
        expect(req.payload.journeyKeys).toEqual({
          foo: "bar",
          first: "abc123",
          second: "abc123",
        });
      });

      it("should call next with any linkedFiles error", () => {
        let err = new Error();
        linkedFiles.add.mockImplementation((req, res, callback) => {
          callback(err);
        });
        req.payload = {
          files: {
            first: "testdata",
          },
        };
        instance.middlewareDecodePayload(req, res, next);
        expect(next).toHaveBeenCalledWith(err);
      });
    });
  });
});
