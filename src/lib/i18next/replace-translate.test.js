const { replaceTranslate } = require("./replace-translate");

describe("replaceTranslate", () => {
  let req;
  let res;
  let next;

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

  it("should call next", () => {
    replaceTranslate(req, res, next);

    expect(next).to.have.been.calledWithExactly();
  });
});
