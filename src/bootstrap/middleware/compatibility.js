export const browserCompatibilityMiddleware = () => (req, res, next) => {
  res.setHeader("X-UA-Compatible", "IE=edge,chrome=1");
  next();
};
