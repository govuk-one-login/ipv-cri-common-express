const headers = require("./headers");

describe("headers", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    const setup = setupDefaultMocks();
    req = setup.req;
    req["x-forwarded-proto"] = "http";

    res = setup.res;
    next = setup.next;

    headers(req, res, next);
  });

  it("should set 'x-forwarded-proto' as 'https'", () => {
    expect(req.headers["x-forwarded-proto"]).to.equal("https");
  });

  it("should call next", () => {
    expect(next).to.have.been.called;
  });
});
