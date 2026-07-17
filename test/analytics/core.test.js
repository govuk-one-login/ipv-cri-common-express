import { describe, beforeEach, afterEach, it, expect } from "vitest";

describe("Core", () => {
  beforeEach(async () => {
    global.window = {
      DI: {
        core: {
          sendData: () => "sent!",
        },
        cookies: {
          getCookie: () => "en",
        },
      },
    };
    global.document = {
      documentElement: {
        firstChild: {
          child: {},
          appendChild(element) {
            Object.assign(this.child, element);
          },
        },
      },
      createElement(tagNameInput) {
        var object = {
          tag: tagNameInput,
          async: "",
          src: "",
          type: "",
          setAttribute: (name, value) => {
            object[name] = value;
          },
        };
        return object;
      },
    };
    require("../../src/assets/javascript/analytics/core");
  });
  afterEach(() => {
    delete require.cache[
      require.resolve("../../src/assets/javascript/analytics/core")
    ];
  });

  it("Sends data to the data layer", function () {
    global.window.DI.core.sendData({ foo: "bar" });
    expect(global.window.dataLayer[0]).toEqual({ foo: "bar" });
  });

  it("Creates gtmscript tag", function () {
    global.window.DI.core.load("12345");
    var gtmElement = global.document.documentElement.firstChild.child;
    expect(gtmElement.src).toEqual(
      "https://www.googletagmanager.com/gtm.js?id=12345",
    );
  });
});
