import { expect, describe, it } from "vitest";

const userIpAddress = require("./user-ip-address");

describe("user ip address", () => {
  it("should return null when passing req but with req.headers as null", () => {
    const forwarded = null;
    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual(null);
  });

  it("should return Ip Address in forwarded header", () => {
    const forwarded = "for=192.0.2.0;host=subdomain.example.gov.uk;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual("192.0.2.0");
  });

  it("should return forwarded header with ipV4 address", () => {
    const forwarded =
      "host=subdomain.example.gov.uk;for=  192.0.2.0  ;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual("192.0.2.0");
  });

  it("should return forwarded header with ipV6 address", () => {
    const forwarded =
      "host=subdomain.example.gov.uk;for=2001:db8:3333:4444:5555:6666:7777:8888;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual("2001:db8:3333:4444:5555:6666:7777:8888");
  });

  it("should return null address when we have no for iteam", () => {
    const forwarded = "host=subdomain.example.gov.uk;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual(null);
  });

  it("should return null address when we have empty ip address in for item", () => {
    const forwarded = "host=subdomain.example.gov.uk;for=;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual(null);
  });
});
