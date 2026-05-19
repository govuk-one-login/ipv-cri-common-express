const proxyquire = require("proxyquire");
const handler = sinon.stub().returns("handler function");
const replaceTranslate = sinon.stub();

const { setI18n, i18next } = proxyquire("./", {
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
    expect(handler).to.have.been.calledWithExactly({
      debug: true,
      secure: false,
      cookieDomain: "sub.domain.local",
      additionalNamespaces: undefined,
      onInit: undefined,
    });
  });
  it("should use replaceTranslate", () => {
    const replaceCall = router.use.getCall(1);

    expect(replaceCall).to.have.been.calledWithExactly(replaceTranslate);
  });

  it("should pass additionalNamespaces through to handler", () => {
    handler.resetHistory();
    setI18n({
      router,
      config: { ...config, additionalNamespaces: ["frontend-ui"] },
    });

    expect(handler).to.have.been.calledWithExactly(
      sinon.match({ additionalNamespaces: ["frontend-ui"] }),
    );
  });

  it("should pass onInit through to handler", () => {
    handler.resetHistory();
    const onInit = sinon.stub();
    setI18n({ router, config, onInit });

    expect(handler).to.have.been.calledWithExactly(sinon.match({ onInit }));
  });

  it("should export the i18next singleton", () => {
    expect(i18next).to.equal(require("i18next"));
  });
});
