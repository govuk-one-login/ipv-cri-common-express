const nunjucks = require("nunjucks");
const { setup: setupNunjucks } = require(
  APP_ROOT + "/src/bootstrap/middleware/nunjucks",
);

describe("nunjucks middleware", () => {
  let app, nunjucksEnv;

  beforeEach(() => {
    app = {
      set: sinon.stub(),
      get: sinon.stub(),
    };
    app.get.withArgs("dev").returns(true);

    sinon.stub(nunjucks, "configure");
    nunjucksEnv = {};
    nunjucksEnv.addGlobal = sinon.stub();
    nunjucks.configure.returns(nunjucksEnv);
  });

  afterEach(() => {
    nunjucks.configure.restore();
  });

  it("should configure nunjucks with a default set of views and options", () => {
    setupNunjucks(app);
    nunjucks.configure.should.have.been.calledWithExactly(
      [
        APP_ROOT + "/test/bootstrap/fixtures/views",
        APP_ROOT + "/node_modules/hmpo-components/components",
        APP_ROOT + "/node_modules/govuk-frontend",
        APP_ROOT + "/node_modules/@govuk-one-login",
      ],
      {
        express: app,
        dev: true,
        noCache: true,
        watch: true,
      },
    );
  });

  it("should filter out a view if not present", () => {
    setupNunjucks(app, { views: ["views", "not_found"] });
    nunjucks.configure.should.have.been.calledWithExactly(
      [
        APP_ROOT + "/test/bootstrap/fixtures/views",
        APP_ROOT + "/node_modules/hmpo-components/components",
        APP_ROOT + "/node_modules/govuk-frontend",
        APP_ROOT + "/node_modules/@govuk-one-login",
      ],
      sinon.match.object,
    );
  });

  it("should run in prod mode if dev flag not set", () => {
    app.get.withArgs("dev").returns(false);

    setupNunjucks(app);
    nunjucks.configure.should.have.been.calledWithExactly(sinon.match.array, {
      express: app,
      dev: false,
      noCache: false,
      watch: false,
    });
  });

  it("should set the view engine value", () => {
    setupNunjucks(app);
    app.set.should.have.been.calledWithExactly("view engine", "html");
  });

  it("should set the Nunjucks environment", () => {
    const result = setupNunjucks(app);
    result.should.equal(nunjucksEnv);
  });
});
