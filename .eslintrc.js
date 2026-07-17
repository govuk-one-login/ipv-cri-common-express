module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  globals: {
    expect: true,
    setupDefaultMocks: true,
    APP_ROOT: "readonly",
    LOGGER_RESET: "readonly",
    CONFIG_RESET: "readonly",
  },
  extends: ["prettier", "eslint:recommended", "plugin:prettier/recommended"],
  ignorePatterns: ["node_modules", "reports", "dist"],
  rules: {
    "no-console": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "any", prev: "*", next: "*" },
    ],
    "no-unused-vars": ["error", { argsIgnorePattern: "(req|res|next)" }],
  },
};
