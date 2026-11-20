import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const redisStub = vi.hoisted(() => ({
  del: vi.fn().mockImplementation((id, callback) => callback()),
  expire: vi.fn(),
  get: vi.fn().mockImplementation((id, callback) => callback(null, "S:data")),
  setex: vi
    .fn()
    .mockImplementation((id, ttl, data, callback) => callback(null)),
}));
vi.mock("../../../src/bootstrap/lib/redis-client.js", () => ({
  getRedisClient: () => redisStub,
}));

vi.mock("../../../src/bootstrap/middleware/linked-files-utils.js", () => ({
  add: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));
import {
  add,
  get,
  del,
} from "../../../src/bootstrap/middleware/linked-files-utils.js";

import { linkedFilesMiddleware } from "../../../src/bootstrap/middleware/linked-files.js";

const testUuid = "abcd1234-5678-9012-3456-abcdef1234567890";

describe("Linked Files", () => {
  let res;
  let req;
  const next = vi.fn();
  const cb = vi.fn();

  beforeEach(() => {
    req = { session: {} };
    res = {
      finished: true,
      statusCode: 200,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("middleware", () => {
    it("should be a function", () => {
      expect(typeof linkedFilesMiddleware).toBe("function");
    });

    it("should call next", () => {
      linkedFilesMiddleware()(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    describe("should add curried functions into the req object", () => {
      beforeEach(() => {
        linkedFilesMiddleware()(req, res, next);
      });

      it("#add", () => {
        expect(typeof req.linkedFiles.add).toBe("function");
        req.linkedFiles.add("abcd", cb);
        expect(add).toHaveBeenCalledWith(req, 30000, "abcd", cb);
      });

      it("#get", () => {
        expect(typeof req.linkedFiles.get).toBe("function");
        req.linkedFiles.get(testUuid, cb);
        expect(get).toHaveBeenCalledWith(req, testUuid, cb);
      });

      it("#del", () => {
        expect(typeof req.linkedFiles.del).toBe("function");
        req.linkedFiles.del(testUuid, cb);
        expect(del).toHaveBeenCalledWith(req, testUuid, cb);
      });
    });

    it("should call redis expire for each file in the session", async () => {
      req.session.linkedFiles = {
        123: true,
        456: true,
      };

      linkedFilesMiddleware({ ttl: 1800 })(req, res, next);

      await vi.waitFor(() => {
        // wait for onFinished() to have completed
        expect(redisStub.expire).toHaveBeenCalledTimes(2);
      });
      expect(redisStub.expire).toHaveBeenCalledWith("file:123", 1800);
      expect(redisStub.expire).toHaveBeenCalledWith("file:456", 1800);
    });

    it("should call not call expire if the session has been removed", () => {
      req.session.linkedFiles = {
        123: true,
        456: true,
      };

      linkedFilesMiddleware({ ttl: 1800 })(req, res, next);

      delete req.session;

      setImmediate(() => {
        expect(redisStub.expire).not.toHaveBeenCalled();
      });
    });

    it("should not extend any expiry times if there are no linked files", () => {
      linkedFilesMiddleware({ ttl: 1800 })(req, res, next);

      setImmediate(() => {
        expect(redisStub.expire).not.toHaveBeenCalled();
      });
    });
  });
});
