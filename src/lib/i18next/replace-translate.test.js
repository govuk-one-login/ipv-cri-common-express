const proxyquire = require("proxyquire");

describe("replaceTranslate", () => {
  let req;
  let res;
  let next;
  let warn;
  let replaceTranslate;

  beforeEach(() => {
    const setup = setupDefaultMocks();
    req = setup.req;
    res = setup.res;
    next = setup.next;

    req.translate = undefined;

    req.i18n = {
      getFixedT: sinon.stub(),
      language: "en",
    };

    warn = sinon.stub();
    ({ replaceTranslate } = proxyquire("./replace-translate", {
      "../../bootstrap/lib/logger": {
        get: sinon.stub().returns({ warn }),
      },
    }));
  });

  it("should call getFixedT with language", () => {
    replaceTranslate(req, res, next);

    expect(req.i18n.getFixedT).to.have.been.calledWithExactly(
      req.i18n.language,
    );
  });

  it("should replace translate with getFixedT function", () => {
    const translate = sinon.fake();
    req.i18n.getFixedT.returns(translate);
    replaceTranslate(req, res, next);

    expect(req.translate).to.equal(translate);
  });

  it("should set res.locals.translate as a function", () => {
    replaceTranslate(req, res, next);

    expect(res.locals.translate).to.be.a("function");
  });

  it("should call translate with res.locals spread as interpolation context", () => {
    const translate = sinon.stub();
    req.i18n.getFixedT.returns(translate);
    res.locals.favFood = "Sausage";

    replaceTranslate(req, res, next);
    res.locals.translate("some.key");

    expect(translate).to.have.been.calledWithExactly(
      "some.key",
      sinon.match({ favFood: "Sausage" }),
    );
  });

  it("should allow opts to override res.locals in interpolation context", () => {
    const translate = sinon.stub();
    req.i18n.getFixedT.returns(translate);
    res.locals.favFood = "Sausage";

    replaceTranslate(req, res, next);
    res.locals.translate("some.key", { favFood: "Saucisson" });

    expect(translate).to.have.been.calledWithExactly(
      "some.key",
      sinon.match({ favFood: "Saucisson" }),
    );
  });

  it("should not overwrite an existing res.locals.translate", () => {
    const existing = sinon.fake();
    res.locals.translate = existing;

    replaceTranslate(req, res, next);

    expect(res.locals.translate).to.equal(existing);
  });

  it("should warn when res.locals.translate is already set", () => {
    res.locals.translate = sinon.fake();

    replaceTranslate(req, res, next);

    expect(warn).to.have.been.calledOnce;
  });

  it("should only warn once across multiple requests", () => {
    res.locals.translate = sinon.fake();

    replaceTranslate(req, res, next);
    replaceTranslate(req, res, next);
    replaceTranslate(req, res, next);

    expect(warn).to.have.been.calledOnce;
  });

  it("should not warn when res.locals.translate is unset", () => {
    replaceTranslate(req, res, next);

    expect(warn).to.not.have.been.called;
  });

  it("should call next", () => {
    replaceTranslate(req, res, next);

    expect(next).to.have.been.calledWithExactly();
  });
});
