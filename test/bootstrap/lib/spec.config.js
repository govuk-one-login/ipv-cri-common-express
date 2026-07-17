import { describe, beforeEach, afterEach, it, vi, expect } from "vitest";

const hmpoConfig = require("hmpo-config");
const config = require(APP_ROOT + "/src/bootstrap/lib/config");

describe("Config", () => {
  beforeEach(() => {
    vi.spyOn(hmpoConfig.prototype, "addConfig");
    vi.spyOn(hmpoConfig.prototype, "addFile");
    vi.spyOn(hmpoConfig.prototype, "addString");
    vi.spyOn(hmpoConfig.prototype, "toJSON").mockReturnValue({
      returned: "config",
    });
    delete global.GLOBAL_CONFIG;
  });

  afterEach(() => {
    hmpoConfig.prototype.addConfig.mockRestore();
    hmpoConfig.prototype.addFile.mockRestore();
    hmpoConfig.prototype.addString.mockRestore();
    hmpoConfig.prototype.toJSON.mockRestore();
    CONFIG_RESET();
  });

  it("exports functions", () => {
    expect(typeof config).toBe("function");
    expect(typeof config.setup).toBe("function");
    expect(typeof config.get).toBe("function");
    expect(config.get).toEqual(config);
  });

  describe("setup", () => {
    it("loads config using defaults", () => {
      config.setup();

      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledTimes(3);

      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith(
        "config/default.json",
      );
      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith(
        "config/default.yaml",
      );
      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith(
        "config/default.yml",
      );

      // expect(hmpoConfig.prototype.addConfig).not.toHaveBeenCalled();
      expect(hmpoConfig.prototype.addString).not.toHaveBeenCalled();

      expect(global.GLOBAL_CONFIG).toEqual({ returned: "config" });
    });

    it("loads config using specified files", () => {
      config.setup({ files: ["a.json", "b.json"] });

      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledTimes(2);

      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith("a.json");
      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith("b.json");

      // expect(hmpoConfig.prototype.addConfig).not.toHaveBeenCalled();
      expect(hmpoConfig.prototype.addString).not.toHaveBeenCalled();

      expect(global.GLOBAL_CONFIG).toEqual({ returned: "config" });
    });

    it("merges config config using defaults", () => {
      config.setup();
      config.setup();

      expect(hmpoConfig.prototype.addConfig).toHaveBeenCalledWith({
        returned: "config",
      });
    });

    it("configures using environment variables", () => {
      const env = {
        HMPO_CONFIG: '{ config: "string" }',
      };
      config.setup({ _environmentVariables: env });

      expect(hmpoConfig.prototype.addString).toHaveBeenCalledWith(
        '{ config: "string" }',
      );
    });

    it("configures using command line options", () => {
      const args = [
        "node",
        ".",
        "-a",
        "blah",
        "-c",
        "configfile.json",
        "-c",
        "configfile.yaml",
      ];
      config.setup({ _commandLineArgs: args });

      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith(
        "configfile.json",
      );
      expect(hmpoConfig.prototype.addFile).toHaveBeenCalledWith(
        "configfile.yaml",
      );
    });

    it("sets the timezone if specified in config", () => {
      const env = {};
      hmpoConfig.prototype.toJSON.mockReturnValue({ timezone: "BST" });
      config.setup({ _environmentVariables: env });

      expect(env.TZ).toEqual("BST");
    });
  });

  describe("get", () => {
    it("throws an error if no config is loaded", () => {
      expect(() => config.get("key")).toThrow("Config not loaded");
    });

    it("returns a value from config", () => {
      global.GLOBAL_CONFIG = { key: "value" };
      const result = config.get("key");
      expect(result).toEqual("value");
    });

    it("returns a deep value from config", () => {
      global.GLOBAL_CONFIG = { obj: { obj2: { key: "value" } } };
      const result = config.get("obj.obj2.key");
      expect(result).toEqual("value");
    });

    it("returns undefined if any part of the path is not found", () => {
      global.GLOBAL_CONFIG = { obj: { obj2: { key: "value" } } };
      const result = config.get("obj.obj3.key");
      expect(result).toBeUndefined();
    });

    it("returns default value if any part of the path is not found", () => {
      global.GLOBAL_CONFIG = { obj: { obj2: { key: "value" } } };
      const result = config.get("obj.obj3.key", "default");
      expect(result).toEqual("default");
    });

    it("returns config root with no path specified", () => {
      global.GLOBAL_CONFIG = { obj: { obj2: { key: "value" } } };
      const result = config.get();
      expect(result).toEqual(global.GLOBAL_CONFIG);
    });
  });
});
