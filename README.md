# ipv-cri-common-express

[![GitHub Action: Scan repository](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml/badge.svg?branch=main)](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml?query=branch%3Amain)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ipv-cri-common-express&metric=coverage)](https://sonarcloud.io/summary/overall?id=ipv-cri-common-express)

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
