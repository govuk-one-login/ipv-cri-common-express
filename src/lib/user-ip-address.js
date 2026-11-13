import { isIPv4, isIPv6 } from "node:net";

export function extractIpAddress(forwarded) {
  const forwardedHeaders = Object.fromEntries(
    forwarded?.split(";").map((s) => s.split("=")) ?? [],
  );
  const clientIp = forwardedHeaders?.for?.toString().trim();
  return isIPv4(clientIp) || isIPv6(clientIp) ? clientIp : null;
}
