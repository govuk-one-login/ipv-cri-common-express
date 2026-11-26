import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig(
  {
    ignores: ["dist/**/*"],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: globals.node,
    },
    linterOptions: {
      reportUnusedInlineConfigs: "error",
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // client-side JS
    files: ["src/assets/javascript/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Google Analytics
        ga: "readonly",
        dataLayer: "readonly",
      },
    },
  },
  {
    files: ["test/**/*.test.js", "**/*.test.js", "**/spec*.js"],
    languageOptions: {
      globals: {
        // set in test/bootstrap/helper.js
        APP_ROOT: "readonly",
        LOGGER_RESET: "readonly",
        CONFIG_RESET: "readonly",
      },
    },
  },
);
