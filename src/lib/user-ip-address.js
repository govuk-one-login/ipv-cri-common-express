const net = require("node:net");

module.exports = function extractIpAddress(forwarded) {
  const forwardedHeaders = Object.fromEntries(
    forwarded?.split(";").map((s) => s.split("=")) ?? [],
  );
  const clientIp = forwardedHeaders?.for?.toString().trim();
  return net.isIPv4(clientIp) || net.isIPv6(clientIp) ? clientIp : null;
};
