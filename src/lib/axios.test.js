const proxyquire = require("proxyquire");

let axiosStub = {};
const axios = proxyquire("./axios", {
  axios: axiosStub,
});

describe("axios", () => {
  let req;
  let res;
  let next;

  let axiosClient;

  beforeEach(() => {
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.app = {
      get: sinon.stub(),
    };
    req.app.get.withArgs("API.BASE_URL").returns("http://example.net");

    axiosClient = {
      interceptors: {
        request: {
          use: sinon.stub(),
        },
        response: {
          use: sinon.stub(),
        },
      },
    };

    axiosStub.create = sinon.fake.returns(axiosClient);
  });

  it("should create 'axios' with BASE_URL", () => {
    axios(req, res, next);

    expect(axiosStub.create).to.have.been.calledWith({
      baseURL: "http://example.net",
    });
  });

  it("should add 'axios' on 'req'", () => {
    axios(req, res, next);

    expect(req.axios).to.equal(axiosClient);
  });

  context("with 'scenarioIdHeader'", () => {
    it("should add x-scenario-id to axios headers", () => {
      axiosClient.defaults = { headers: { common: {} } };

      req.scenarioIDHeader = "test-scenario-success";

      axios(req, res, next);

      expect(req.axios.defaults.headers.common["x-scenario-id"]).to.equal(
        "test-scenario-success",
      );
    });
  });

  context("without 'scenarioIdHeader'", () => {
    it("should not x-scenario-id to axios headers", () => {
      delete req.scenarioIdHeader;

      axios(req, res, next);

      expect(req.axios?.defaults?.headers?.common?.["x-scenario-id"]).to.be
        .undefined;
    });
  });

  context("without defaults'", () => {
    it("should not x-scenario-id to axios headers", () => {
      delete axiosClient.defaults;
      req.scenarioIdHeader = "test-scenario-success";

      axios(req, res, next);

      expect(req.axios?.defaults?.headers?.common?.["x-scenario-id"]).to.be
        .undefined;
    });

    it("should not x-forwarded-for to axios headers", () => {
      delete axiosClient.defaults;
      req.headers["forwarded"] =
        "for=192.0.2.0;host=subdomain.example.gov.uk;proto=http";

      axios(req, res, next);

      expect(req.axios?.defaults?.headers?.common?.["x-forwarded-for"]).to.be
        .undefined;
    });
  });

  context("with 'x-forwarded-for'", () => {
    it("should add x-forwarded-for to axios headers", () => {
      axiosClient.defaults = { headers: { common: {} } };

      req.headers["forwarded"] =
        "for=192.0.2.0;host=subdomain.example.gov.uk;proto=http";

      axios(req, res, next);

      expect(req.axios.defaults.headers.common["x-forwarded-for"]).to.equal(
        "192.0.2.0",
      );
    });
  });

  context("without 'x-forwarded-for'", () => {
    it("should not x-forwarded-for to axios headers", () => {
      delete req.headers["forwarded"];

      axios(req, res, next);

      expect(req.axios?.defaults?.headers?.common?.["x-forwarded-for"]).to.be
        .undefined;
    });
    it("should not x-forwarded-for to axios headers while header is null", () => {
      delete axiosClient.defaults;
      req.headers["forwarded"] = null;

      axios(req, res, next);

      expect(req.axios?.defaults?.headers?.common?.["x-forwarded-for"]).to.be
        .undefined;
    });
  });
});
