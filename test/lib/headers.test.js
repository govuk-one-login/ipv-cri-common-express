import { expect, it, describe, beforeEach } from "vitest";
import { createDefaultReqResNext } from "../utils/helpers";
import { setProtocolHeader } from "../../src/lib/headers.js";

describe("headers", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    const setup = createDefaultReqResNext();
    req = setup.req;
    req["x-forwarded-proto"] = "http";

    res = setup.res;
    next = setup.next;

    setProtocolHeader(req, res, next);
  });

  it("should set 'x-forwarded-proto' as 'https'", () => {
    expect(req.headers["x-forwarded-proto"]).toEqual("https");
  });

  it("should call next", () => {
    expect(next).toHaveBeenCalled();
  });
});
