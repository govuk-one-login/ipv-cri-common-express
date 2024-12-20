module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    es2020: true,
    mocha: true,
  },
  globals: {
    sinon: true,
    expect: true,
    setupDefaultMocks: true,
    APP_ROOT: 'readonly',
    LOGGER_RESET: 'readonly',
    CONFIG_RESET: 'readonly',
  },
  extends: ["prettier", "eslint:recommended", "plugin:prettier/recommended"],
  ignorePatterns: ["wallaby.conf.js", "node_modules", "reports", "dist"],
  rules: {
    "no-console": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "any", prev: "*", next: "*" },
    ],
    "no-unused-vars": [
      "error",
      {argsIgnorePattern: "(req|res|next)"}
    ]
  },
  overrides: [
    {
      files: "**/*.test.js",
      plugins: ["mocha"],
      extends: ["plugin:mocha/recommended"],
      rules: {
        "mocha/no-mocha-arrows": 0,
        "mocha/no-setup-in-describe": 0,
      },
    },
    {
      files: "**/spec**.js",
      plugins: ["mocha"],
      extends: ["plugin:mocha/recommended"],
      rules: {
        "mocha/no-mocha-arrows": 0,
        "mocha/no-setup-in-describe": 0,
      },
    },
  ]
};
