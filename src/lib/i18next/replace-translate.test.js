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

  it("should call next", () => {
    replaceTranslate(req, res, next);

    expect(next).to.have.been.calledWithExactly();
  });
});
