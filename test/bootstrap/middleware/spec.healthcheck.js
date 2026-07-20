import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";

const healthcheck = require(APP_ROOT + "/src/bootstrap/middleware/healthcheck");
const os = require("os");

describe("healthcheck", () => {
  let req, res;
  let originalPmId = process.env.pm_id;

  beforeEach(() => {
    req = {
      path: "/healthcheck",
      url: "/healthcheck",
      connection: {
        remoteAddress: "127.0.0.1",
      },
    };
    res = {
      setHeader: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
    };
    res.setHeader.mockReturnValue(res);
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    vi.spyOn(os, "hostname").mockReturnValue("myhostname");
    delete process.env.pm_id;
  });

  afterEach(() => {
    os.hostname.mockRestore();
    if (originalPmId) {
      process.env.pm_id = originalPmId;
    } else {
      delete process.env.pm_id;
    }
  });

  it("should set Connection header to close", () => {
    healthcheck.middleware()(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Connection", "close");
  });

  it("should return a 200 status", () => {
    healthcheck.middleware()(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: "test",
        id: "myhostname",
        uptime: expect.any(Number),
        version: "1.0.1",
        status: "OK",
      }),
    );
  });

  it("should run healthFn with status code information", () => {
    const healthFn = (result) => {
      result.error = {
        code: "ERROR",
        message: "An error",
      };
    };
    healthcheck.middleware({ healthFn })(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: "test",
        id: "myhostname",
        uptime: expect.any(Number),
        version: "1.0.1",
        error: {
          code: "ERROR",
          message: "An error",
        },
        status: "ERROR",
      }),
    );
  });

  it("should run healthFn with status message information", () => {
    const healthFn = (result) => {
      result.error = {
        message: "An error",
      };
    };
    healthcheck.middleware({ healthFn })(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: "test",
        id: "myhostname",
        uptime: expect.any(Number),
        version: "1.0.1",
        error: {
          message: "An error",
        },
        status: "An error",
      }),
    );
  });

  it("should run async healthFn with status information", async () => {
    const healthFn = async () => {
      const error = new Error("An error");
      error.code = "ERROR";
      throw error;
    };
    healthcheck.middleware({ healthFn })(req, res);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(500);
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "myhostname",
        uptime: expect.any(Number),
        version: "1.0.1",
        error: {
          code: "ERROR",
          message: "An error",
        },
        status: "ERROR",
      }),
    );
  });

  it("should append pm id to id if present", () => {
    process.env.pm_id = "1";

    healthcheck.middleware()(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "myhostname-1",
      }),
    );
  });
});
