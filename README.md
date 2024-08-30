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

## Environment Variables

Several environment variables are declared within the CRIs and then used within the shared code of this repository:

- `GA4_DISABLED` - Feature flag to disable GA4, defaulted to `false`
- `UA_DISABLED` - Feature flag to disable UA, defaulted to `true`
- `UA_CONTAINER_ID` - Container ID for Universal Analytics, required for UA to work correctly. Default value is `GTM-TK92W68`
- `GA4_CONTAINER_ID` - Container ID for GA4, required for analytics to work correctly. Default value is `GTM-KD86CMZ`
- `ANALYTICS_COOKIE_DOMAIN` - Cookie domain to persist values throughout the different sections of the OneLogin journey. Default value is `localhost`
- `ANALYTICS_DATA_SENSITIVE` - Redacts all form response data, defaulted to `true`. Only to be set to `false` if a journey section contains no PII in none text based form controls

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

# Release Procedure

Releases are automatically published to [npm](https://npmjs.com) at [@govuk-one-login/di-ipv-cri-common-express](https://www.npmjs.com/package/@govuk-one-login/di-ipv-cri-common-express) using a [GitHub action](./github/workflows/publish.yml) upon creation of an appropriate Git tag.

> The previous usage of `"govuk-one-login/ipv-cri-common-express.git#v4.0.0"` should not be used as this has no support for package building, which will be a requirement with future improemetns

In order to prepare a new release

1. `git checkout` a fresh copy of the `main` branch
2. create a separate branch for the version to be updated to (e.g. `chore/release/v1.2.3`)
3. Run `npm version VERSION --no-git-tag-version`, changing `VERSION` to be `major`, `minor` or `patch` as required
   - Once this has been run, the `package.json` and `package-lock.json` files will be updated with the new version.
4. Ensure that the [RELEASE_NOTES](./RELEASE_NOTES.md) have been updated with the new version
5. Create a PR for this change, and get this approved and merged
6. Once this has been done, a release can be created using GitHub by accessing the [releases](https://github.com/govuk-one-login/ipv-cri-common-express/releases) section.
7. Choose a new tag matching your version number, prefixed with `v` to avoid Git reference collisions, e.g. `v1.2.3`
8. Click on the "Generate release notes" button to automatically pull in commit messages for the release notes.

# Code Owners

This repo has a `CODEOWNERS` file in the root and is configured to require PRs to reviewed by Code Owners.

# Peer Dependencies

This node package includes the initialisation script from the GDS Analytics package (https://www.npmjs.com/package/@govuk-one-login/frontend-analytics).
