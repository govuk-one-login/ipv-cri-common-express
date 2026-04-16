import net from "net"
import fromPairs from "lodash.frompairs"

export default (forwarded: string | null | undefined) => {
  const forwardedHeaders = fromPairs(
    forwarded?.split(";").map((s) => s.split("=")),
  );
  const clientIp = forwardedHeaders?.for?.toString().trim();
  return net.isIPv4(clientIp) || net.isIPv6(clientIp) ? clientIp : null;
};
