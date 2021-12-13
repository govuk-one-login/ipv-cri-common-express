const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiAsPromised = require("chai-as-promised");
const reqres = require("reqres");

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

global.sinon = sinon;
global.expect = expect;

global.setupDefaultMocks = () => {
  const req = reqres.req({
    form: {
      options: {
        fields: {},
      },
    },
    axios: {
      get: sinon.fake(),
      post: sinon.fake(),
      put: sinon.fake(),
    },
  });

  const res = reqres.res({});
  const next = sinon.fake();
  return {
    req,
    res,
    next,
  };
};
