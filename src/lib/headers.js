module.exports = function setProtocolHeader(req, res, next) {
  req.headers["x-forwarded-proto"] = "https";

  next();
};
