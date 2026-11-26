# ipv-cri-common-express

[![GitHub Action: Scan repository](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml/badge.svg?branch=main)](https://github.com/govuk-one-login/ipv-cri-common-express/actions/workflows/scan-repo.yml?query=branch%3Amain)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ipv-cri-common-express&metric=coverage)](https://sonarcloud.io/summary/overall?id=ipv-cri-common-express)

`ipv-cri-common-express` contains [Express](https://expressjs.com/) libraries and utilities for use for building GOV.UK One Login Credential Issuers

It provides functionality for use with an [Express webserver](https://expressjs.com/), [GOV.UK Design System](https://design-system.service.gov.uk/) and the [HMPO Components library](https://github.com/HMPO/hmpo-components)

It was originally created in order to share code between Credential Issuers in a prescribed but abstract way. The use of shared code then allows the Credential Issuers to solely focus on whatever the specific screens and interactions that are required as part of their use case.

This package contains:

- [bootstrap](./src/bootstrap)
  - Express app bootstrap, originally copied from [hmpo-app](https://github.com/HMPO/hmpo-app)
- [components](./src/components)
  - Common [Nunjucks](https://mozilla.github.io/nunjucks/) templates
- [lib](./src/lib)
  - Express middleware
- [routes](./src/routes)
  - Express router to handle common OAuth functionality
- [scripts](./scripts)
  - checkTranslations script used to ensure localisation files are kept synchronised

The combination of components, middleware, routing and utility scripts into a single package has resulted in a slightly muddled approach to how this package is used and maintained. Some logic is being extracted into `@govuk-one-login/frontend-*` packages in the [govuk-one-login-frontend monorepo](https://github.com/govuk-one-login/govuk-one-login-frontend/), and work is planned in the CRI teams to simplify frontends and centralise as much logic as possible.

# Installation

Clone this repository and then run

```bash
npm install
```

# Development

## Tests

[vitest](https://vitest.dev/) is used as the testing framework.

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

In order to prepare a new release

1. Update `package.json` with your new version, run `npm install` to ensure that `package-lock.json` is updated, and get your change merged to main
2. Once this has been done, a release can be created using GitHub by accessing the [releases](https://github.com/govuk-one-login/ipv-cri-common-express/releases) section.
3. Choose a new tag matching your version number, prefixed with `v` to avoid Git reference collisions, e.g. `v1.2.3`
4. Click on the "Generate release notes" button to automatically pull in commit messages for the release notes.
5. Ensure that you select the 'Latest' tickbox under 'Release label' if you are releasing the new highest-numbered version (usually this is the case, but not true if patching a previous major version)

## `npm` tagging

The 'Latest' label on the GitHub release is used to choose the tag that npm applies to the published package version. If the release being published is 'Latest' then it is published to npm as `latest`, meaning it will be automatically installed when consumers execute either of the following:

```sh
npm install @govuk-one-login/di-ipv-cri-common-express
npm install @govuk-one-login/di-ipv-cri-common-express@latest
```

By contrast, if the release being published is not 'Latest' then it will be given the `legacy` tag in npm. Tags can be seen in the ['Versions' tab on npmjs.com](https://www.npmjs.com/package/@govuk-one-login/di-ipv-cri-common-express?activeTab=versions).

## Supporting legacy versions

In some cases, we may need to patch an older major version of common-express to resolve issues such as vulnerabilities.

This should be done by using the following process, using version 15 as an example:

- Create a new branch, `v15`, at the last `main` commit before version 16
  - The branch will be automatically covered by branch protection rules so will need PRs to be pushed to
- Commit your changes on a feature branch `myfeature-v15`, starting at the same commit
- Raise a pull request from `myfeature-v15` to `v15` and get the necessary approvals
- Once merged, create a release following the process above and be sure to leave 'Release label' unset (ie, not 'Latest').

# Peer Dependencies

This node package includes the initialisation script from the GDS Analytics package (https://www.npmjs.com/package/@govuk-one-login/frontend-analytics).
