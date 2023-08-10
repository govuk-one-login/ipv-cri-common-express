const proxyquire = require("proxyquire").noCallThru();

let handler;
let i18next;
let i18NextFsBackend;
let i18NextHttpMiddleware;
let defaultConfig;
let configure;

defaultConfig = {
  supportedLngs: ["en", "cy"],
};

i18next = {
  use: sinon.stub().returnsThis(),
  init: sinon.stub(),
};

i18NextHttpMiddleware = {
  LanguageDetector: "LanguageDetector",
  handle: sinon.stub().returns("instantiated handler"),
};

configure = {
  configure: sinon.stub().returns(defaultConfig),
};

i18NextFsBackend = sinon.stub();

handler = proxyquire("./handler", {
  i18next,
  "i18next-fs-backend": i18NextFsBackend,
  "i18next-http-middleware": i18NextHttpMiddleware,
  "./configure": configure,
});
describe("handler", () => {
  beforeEach(() => {
    i18next.init.reset();
    configure.configure.reset();

    configure.configure.returns(defaultConfig);
  });

  it("should call i18next.use with backend", () => {
    handler.handler();

    const firstUse = i18next.use.getCall(0);

    expect(firstUse).to.have.been.calledWith(i18NextFsBackend);
  });

  it("should call i18next.use with language detector", () => {
    handler.handler();

    const firstUse = i18next.use.getCall(1);

    expect(firstUse).to.have.been.calledWith(
      i18NextHttpMiddleware.LanguageDetector,
    );
  });

  it("should call init with config", () => {
    handler.handler();

    expect(i18next.init).to.have.been.calledWithExactly(defaultConfig);
  });

  it("should call configure with config from params", () => {
    handler.handler({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(configure.configure).to.have.been.calledWithExactly({
      debug: true,
      secure: true,
      cookieDomain: "subdomain.local",
    });
  });
  it("should call init with result from configure", () => {
    handler.handler({
      secure: true,
      cookieDomain: "subdomain.local",
    });

    expect(i18next.init).to.have.been.calledWithExactly(defaultConfig);
  });

  it("should call i18nextMiddleware.handle with options", () => {
    handler.handler();

    expect(i18NextHttpMiddleware.handle).to.have.been.calledWith(i18next, {
      ignoreRoutes: ["/public"],
    });
  });

  it("should return i18nextMiddleware handler", () => {
    let instantiatedHandler = handler.handler();

    expect(instantiatedHandler).to.equal("instantiated handler");
  });
});
