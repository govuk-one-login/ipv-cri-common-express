const proxyquire = require("proxyquire");
const handler = sinon.stub().returns("handler function");
const replaceTranslate = sinon.stub();

const { setI18n } = proxyquire("./", {
  "./handler": {
    handler,
  },
  "./replace-translate": {
    replaceTranslate,
  },
});

describe("i18next", () => {
  let router;
  let config;

  beforeEach(() => {
    router = { use: sinon.stub() };
    config = { debug: true, secure: false, cookieDomain: "sub.domain.local" };

    setI18n({ router, config });
  });

  it("should use handler", () => {
    const handlerCall = router.use.getCall(0);

    expect(handlerCall).to.have.been.calledWithExactly("handler function");
  });
  it("should call handler", () => {
    expect(handler).to.have.been.calledWithExactly(config);
  });
  it("should use replaceTranslate", () => {
    const replaceCall = router.use.getCall(1);

    expect(replaceCall).to.have.been.calledWithExactly(replaceTranslate);
  });
});
