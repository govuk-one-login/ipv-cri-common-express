# di-ipv-cri-common-express

[![Github Action: Unit Tests](https://github.com/alphagov/di-ipv-cri-common-express/actions/workflows/checks.yml/badge.svg)](https://github.com/alphagov/di-ipv-cri-common-express/actions/workflows/checks.yml?query=branch%3Amain)

di-ipv-cri-common-express contains Express libraries and utilities for use building GOV.UK One Login Credential Issuers

It provides functionality for use with an [Express webserver](https://expressjs.com/), [GOV.UK Design System](https://design-system.service.gov.uk/) and the [HMPO Components library](https://github.com/HMPO/hmpo-components)

This package contains:

- [assets](./src/assets)
  - JavaScript used for progressive enhancement
- [components](./src/components)
  - Common [Nunjucks](https://mozilla.github.io/nunjucks/)
- [lib](./src/lib)
  - Express middleware
- [routes](./src/routes)
  - Express router to handle common OAuth functionality
- [scripts](./scripts)
  - checkTranslations script used to ensure localisation files are kept synchronised

# GA4 and the Crown Logo

The implementation of GA4 and the Crown Logo update are contained across multiple versions of common-express in various stages. See below for details:

## 5.1.0

- Contains the flag to activate the new crown logo set to true ready for go-live of that feature

# Installation

Clone this repository and then run

```bash
npm install
```

# Development

## Tests

[mocha](https://mochajs.org/) is used as the testing framework.

To run the tests:

```bash
npm run test
```

## Linting and code formatting

Linting and code formatting are applied using a combination of [prettier](https://prettier.io/), [eslint](https://eslint.org/).

These can be run manually using:

```bash
npm run lint
```

## Commit Hooks

Linting and code formatting is enforced on commit using [pre-commit](https://pre-commit.com/).

Pre-commit hooks can be run manually using:

```bash
pre-commit run --all-files
```

> Note: Husky was previously used, and will need to be de-configured using
> `git config --unset-all core.hooksPath` and re-configured using `pre-commit install`

# Code Owners

This repo has a `CODEOWNERS` file in the root and is configured to require PRs to reviewed by Code Owners.
