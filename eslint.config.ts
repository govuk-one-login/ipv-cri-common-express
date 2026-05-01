import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import mochaPlugin from "eslint-plugin-mocha";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["node_modules/**", "reports/**", "dist/**"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off"
    }
  },
  {
    files: ["**/*.{js}"],
    ignores: ["src/assets/javascript/**"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
        sinon: "writable",
        expect: "writable",
        setupDefaultMocks: "writable",
        APP_ROOT: "readonly",
        LOGGER_RESET: "readonly",
        CONFIG_RESET: "readonly",
      },
    },
    rules: {
      "no-console": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "any", prev: "*", next: "*" },
      ],
      "no-unused-vars": ["error", { argsIgnorePattern: "(req|res|next)" }],
    },
  },
  // browser assets
  {
    files: ["src/assets/javascript/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        dataLayer: "writable",
        ga: "writable",
      },
    },
    rules: {
      "no-console": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "any", prev: "*", next: "*" },
      ],
    },
  },
  // test files (mocha)
  {
    ...mochaPlugin.configs.recommended,
    files: ["**/*.test.js", "**/spec*.js"],
    rules: {
      ...mochaPlugin.configs.recommended.rules,
      "mocha/no-mocha-arrows": "off",
      "mocha/no-setup-in-describe": "off",
    },
  },
]);
