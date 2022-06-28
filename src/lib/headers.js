module.exports = (req, res, next) => {
  req.headers["x-forwarded-proto"] = "https";

  next();
};
