const deepCloneMerge = require('deep-clone-merge');

const middleware = ({
    sessionIDHeader = 'X-SESSION-ID',
    scenarioIDHeader = 'X-SCENARIO-ID',
    ...otherOptions
} = {}) => (req, res, next) => {
    req.modelOptions = options => deepCloneMerge.extend({
        headers: {
            [sessionIDHeader]: req.sessionID,
            [scenarioIDHeader]: req.session && req.session.scenarioID
        },
        logging: {
            req
        }
    }, otherOptions, options);

    next();
};

module.exports = {
    middleware
};
