# ipv-cri-common-express

[![GitHub Action: Scan repository](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml/badge.svg?branch=main)](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml?query=branch%3Amain)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ipv-cri-common-express&metric=coverage)](https://sonarcloud.io/summary/overall?id=ipv-cri-common-express)

`ipv-cri-common-express` contains [Express](https://expressjs.com/) libraries and utilities for use for building GOV.UK One Login Credential Issuers

It provides functionality for use with an [Express webserver](https://expressjs.com/), [GOV.UK Design System](https://design-system.service.gov.uk/) and the [HMPO Components library](https://github.com/HMPO/hmpo-components)

It was originally created in order to share code between Credential Issuers in a prescribed but abstract way. The use of shared code then allows the Credential Issuers to solely focus on whatever the specific screens and interactions that are required as part of their use case.

This package contains:

- [assets](./src/assets)
  - JavaScript used for progressive enhancement
- [components](./src/components)
  - Common [Nunjucks](https://mozilla.github.io/nunjucks/) templates
- [lib](./src/lib)
  - Express middleware
- [routes](./src/routes)
  - Express router to handle common OAuth functionality
- [scripts](./scripts)
  - checkTranslations script used to ensure localisation files are kept synchronised

The combination of components, middleware, routing and utility scripts into a single package has resulted in a slightly muddled approach to how this package is used and maintained. Work towards splitting this up into individual specific packages has already started, beginning with replacing the JavaScript inside the `assets` folder with [@govuk-one-login/frontend-analytics](https://www.npmjs.com/package/@govuk-one-login/frontend-analytics)

# GA4 and the Crown Logo

The implementation of GA4 and the Crown Logo update are contained across multiple versions of common-express in various stages. See below for details:

## 5.1.0

- Contains the flag to activate the new crown logo set to true ready for go-live of that feature

## Environment Variables

Several environment variables are declared within the CRIs and then used within the shared code of this repository:

| Variable                      | Description                                                                                                                                                                                                    | Required            | Default Value |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------- |
| `GA4_ENABLED`                 | Feature flag to enable GA4                                                                                                                                                                                     | No                  | `false`       |
| `UA_ENABLED`                  | Feature flag to enable UA                                                                                                                                                                                      | No                  | `false`       |
| `UA_CONTAINER_ID`             | Container ID for Universal Analytics, required for UA to work correctly                                                                                                                                        | Yes (if UA enabled) | `GTM-TK92W68` |
| `GA4_CONTAINER_ID`            | Container ID for GA4, required for analytics to work correctly                                                                                                                                                 | Yes                 | `GTM-KD86CMZ` |
| `ANALYTICS_COOKIE_DOMAIN`     | Cookie domain to persist values throughout the different sections of the OneLogin journey. Used to set `cookieDomain` flag for `@govuk-one-login/frontend-analytics` package                                   | No                  | `localhost`   |
| `ANALYTICS_DATA_SENSITIVE`    | Redacts all form response data. Only set to `false` if a journey section contains no PII in non-text based form controls. Used to set `isDataSensitive` flag for `@govuk-one-login/frontend-analytics` package | No                  | `true`        |
| `GA4_PAGE_VIEW_ENABLED`       | Feature flag to enable GA4 page view tracking                                                                                                                                                                  | Yes                 | —             |
| `GA4_FORM_RESPONSE_ENABLED`   | Feature flag to enable GA4 form response tracking                                                                                                                                                              | Yes                 | —             |
| `GA4_FORM_ERROR_ENABLED`      | Feature flag to enable GA4 form error tracking                                                                                                                                                                 | Yes                 | —             |
| `GA4_FORM_CHANGE_ENABLED`     | Feature flag to enable GA4 form change tracking                                                                                                                                                                | Yes                 | —             |
| `GA4_NAVIGATION_ENABLED`      | Feature flag to enable GA4 navigation tracking                                                                                                                                                                 | Yes                 | —             |
| `GA4_SELECT_CONTENT_ENABLED`  | Feature flag to enable GA4 select content tracking                                                                                                                                                             | Yes                 | —             |
| `DEVICE_INTELLIGENCE_ENABLED` | Feature flag to enable device intelligence fingerprint component                                                                                                                                               | No                  | `false`       |
| `DEVICE_INTELLIGENCE_DOMAIN`  | Cookie domain for device intelligence fingerprint component                                                                                                                                                    | Yes                 | —             |

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
2. create a separate branch for the version to be updated to (e.g. `chore/release/v1.2.3`
3. Run `npm version VERSION --no-git-tag-version`, changing `VERSION` to be `major`, `minor` or `patch` as required
   - Once this has been run, the `package.json` and `package-lock.json` files will be updated with the new version.
4. Create a PR for this change, and get this approved and merged
5. Once this has been done, a release can be created using GitHub by accessing the [releases](https://github.com/govuk-one-login/ipv-cri-common-express/releases) section.
6. Choose a new tag matching your version number, prefixed with `v` to avoid Git reference collisions, e.g. `v1.2.3`
7. Click on the "Generate release notes" button to automatically pull in commit messages for the release notes.

# Code Owners

This repo has a `CODEOWNERS` file in the root and is configured to require PRs to reviewed by Code Owners.

# Peer Dependencies

This node package includes the initialisation script from the GDS Analytics package (https://www.npmjs.com/package/@govuk-one-login/frontend-analytics).
