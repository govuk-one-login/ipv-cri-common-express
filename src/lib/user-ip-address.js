const net = require("net");
const fromPairs = require("lodash.frompairs");

module.exports = (forwarded) => {
  const forwardedHeaders = fromPairs(
    forwarded?.split(";").map((s) => s.split("=")),
  );
  const clientIp = forwardedHeaders?.for?.toString().trim();
  return net.isIPv4(clientIp) || net.isIPv6(clientIp) ? clientIp : null;
};
