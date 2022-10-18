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
  let app;
  let config;

  beforeEach(() => {
    app = { use: sinon.stub() };
    config = { key: "value" };

    setI18n({ app, config });
  });

  it("should use handler", () => {
    const handlerCall = app.use.getCall(0);

    expect(handlerCall).to.have.been.calledWithExactly("handler function");
  });
  it("should call handler", () => {
    expect(handler).to.have.been.calledWithExactly(config);
  });
  it("should use replaceTranslate", () => {
    const replaceCall = app.use.getCall(1);

    expect(replaceCall).to.have.been.calledWithExactly(replaceTranslate);
  });
});
