const proxyquire = require("proxyquire").noCallThru();

let handler;
let i18next;
let i18NextSyncFsBackend;
let i18NextHttpMiddleware;
let defaultConfig;

defaultConfig = {
  supportedLngs: ["en", "cy"],
  detection: {
    order: ["querystring", "cookie"],
  },
};

i18next = {
  use: sinon.stub().returnsThis(),
  init: sinon.stub(),
};

i18NextHttpMiddleware = {
  LanguageDetector: "LanguageDetector",
  handle: sinon.stub().returns("instantiated handler"),
};

i18NextSyncFsBackend = sinon.stub();

handler = proxyquire("./handler", {
  i18next,
  "i18next-sync-fs-backend": i18NextSyncFsBackend,
  "i18next-http-middleware": i18NextHttpMiddleware,
  "./default-config": defaultConfig,
});
describe("handler", () => {
  beforeEach(() => {
    i18next.init.reset();
  });

  it("should call i18next.use with backend", () => {
    handler.handler();

    const firstUse = i18next.use.getCall(0);

    expect(firstUse).to.have.been.calledWith(i18NextSyncFsBackend);
  });

  it("should call i18next.use with language detector", () => {
    handler.handler();

    const firstUse = i18next.use.getCall(1);

    expect(firstUse).to.have.been.calledWith(
      i18NextHttpMiddleware.LanguageDetector
    );
  });

  it("should call init with config", () => {
    handler.handler();

    expect(i18next.init).to.have.been.calledWithExactly(defaultConfig);
  });

  it("should call init with config from params", () => {
    handler.handler({
      detection: {
        order: ["cookie"],
      },
    });

    expect(i18next.init).to.have.been.calledWithExactly({
      supportedLngs: ["en", "cy"],
      detection: {
        order: ["cookie"],
      },
    });
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
