import { expect, describe, it } from "vitest";

const userIpAddress = require("./user-ip-address");

describe("user ip address", () => {
  it("should return null when passing req but with req.headers as null", () => {
    const forwarded = null;
    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toBeNull();
  });

  it.each([
    {
      description: "should return Ip Address in forwarded header",
      forwarded: "for=192.0.2.0;host=subdomain.example.gov.uk;proto=https",
      expected: "192.0.2.0",
    },
    {
      description: "should return forwarded header with ipV4 address",
      forwarded: "host=subdomain.example.gov.uk;for=  192.0.2.0  ;proto=https",
      expected: "192.0.2.0",
    },
    {
      description: "should return forwarded header with ipV6 address",
      forwarded:
        "host=subdomain.example.gov.uk;for=2001:db8:3333:4444:5555:6666:7777:8888;proto=https",
      expected: "2001:db8:3333:4444:5555:6666:7777:8888",
    },
  ])("$description", ({ forwarded, expected }) => {
    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toEqual(expected);
  });

  it("should return null address when we have no for iteam", () => {
    const forwarded = "host=subdomain.example.gov.uk;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toBeNull();
  });

  it("should return null address when we have empty ip address in for item", () => {
    const forwarded = "host=subdomain.example.gov.uk;for=;proto=https";

    const ipAddress = userIpAddress(forwarded);

    expect(ipAddress).toBeNull();
  });
});
