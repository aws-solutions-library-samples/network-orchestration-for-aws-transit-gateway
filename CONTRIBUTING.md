# Contributing Guidelines

Thank you for your interest in contributing to this project. Whether it's a bug report, new
feature, correction, or additional documentation, we greatly value feedback and
contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure
we have all the necessary information to effectively respond to your bug report or
contribution.

> **Support model.** This project is an **AWS Guidance Solution** — sample code that users
> build, deploy, own, and operate in their own accounts. It is maintained on a best-effort
> basis and does not carry release commitments or ETAs. There are **no AWS-hosted templates
> and no one-click deployment**: each user builds the assets from a release tag and hosts
> them in their own S3 bucket (see [README → Deploy](./README.md#deploy)). Maintainers cut
> releases manually (see [Release process](#release-process-maintainers)).

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check [existing open](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/issues) or [recently closed](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aclosed%20) issues to make sure somebody else hasn't already reported it. Please include as much as you can:

- A reproducible test case or series of steps
- The version of the code being used
- The Region being used
- Any modifications you've made relevant to the bug
- Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request,
please ensure that:

1. You are working against the latest source on the `main` branch.
2. You check existing open and recently merged pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work — we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository (external contributors) or create a branch (maintainers — see [Branching and commits](#branching-and-commits)).
2. Modify the source; please focus on the specific change you are contributing.
3. Add or update unit tests for the changed code.
4. Run `npx npm run prettier-format` in `source` to keep code formatting consistent.
5. Build and test locally:
   ```
   cd source/lambda && poetry install && poetry run pytest
   cd ../ui && npm ci && npm run test
   ```
6. Update [CHANGELOG.md](./CHANGELOG.md) under a new version heading (see [Release process](#release-process-maintainers)).
7. If your change adds capabilities, include PR description text that can be folded into the solution documentation.
8. Commit using clear, [Conventional Commits](https://www.conventionalcommits.org/) messages.
9. In the repository _Security_ section, ensure security advisories are enabled and address any Dependabot issues your change introduces.
10. Send us the pull request, answering the default questions in the PR template.

GitHub provides additional documentation on [forking a repository](https://help.github.com/articles/fork-a-repo/) and [creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Branching and commits

- **Default branch:** `main`. It is always releasable and protected; changes land only through reviewed pull requests.
- **Branch per change:** use a short-lived branch, e.g. `fix/<topic>`, `feature/<topic>`, or `release/vX.Y.Z` for a version bump.
- **Commit messages:** follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`, `chore:`, `test:`, …). Reference the related issue (e.g. `(#211)`).
- **Merge style — squash and merge.** PRs are merged with **"Squash and merge"** so each change becomes a single commit on `main`. Keep logically distinct commits on the branch for review; the squash collapses them on merge. Do **not** force-push to rewrite already-pushed history.
- **Never** force-push to `main` or to a shared branch, and never commit directly to `main`.

## Release process (maintainers)

Releases are **manual**. A release is one squashed commit on `main` titled
`Release vX.Y.Z (#PR)` plus a matching `vX.Y.Z` tag and a GitHub Release. **No deployment
artifacts are published** — users build each release from the tagged source and host it in
their own S3 bucket (see [README → Deploy](./README.md#deploy)).

**1. Prepare the release PR** (branch → PR into `main`):
- Bump the version in `source/ui/package.json`, `source/cognito-trigger/package.json`, and `source/lambda/pyproject.toml`.
- Add a dated `[X.Y.Z]` section to [CHANGELOG.md](./CHANGELOG.md) ([Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format: `Added` / `Changed` / `Fixed` / `Security`).
- Ensure CI, unit tests, and security checks pass.

**2. Merge and tag:**
- **Squash and merge** the PR; set the commit title to `Release vX.Y.Z (#PR)`.
- Delete any stale same-version branches so there is a single lineage per version.
- Tag the resulting `main` commit and push the tag:
  ```
  git checkout main && git pull
  git tag vX.Y.Z <main-commit-sha>
  git push origin vX.Y.Z
  ```
- Create a GitHub Release from the tag, using the CHANGELOG entry as the notes.

**3. Sanity-check the release (recommended, not published):**
- Build from the tag to confirm it builds cleanly:
  ```
  cd deployment
  ./build-s3-dist.sh <BUCKET_BASE> network-orchestration-for-aws-transit-gateway vX.Y.Z <BUCKET_BASE>
  ```
- Optionally smoke-test in a test account: stage to your own bucket and run a fresh deploy
  plus an update from the prior version (see [README → Deploy](./README.md#deploy) and the
  implementation guide). Spoke and organization-role templates rarely change between
  patch releases — check the diff to confirm which stacks a given release actually affects.

That's the whole release. There is no step that uploads assets to a shared or public
bucket; distribution is each user building from the tag.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. This
project uses the default GitHub issue labels (enhancement / bug / duplicate / help wanted /
invalid / question / wontfix); the ['help wanted'](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/labels/help%20wanted) issues are a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security issue notifications

If you discover a potential security issue in this project, we ask that you notify
AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/).
Please do **not** create a public GitHub issue.

## Licensing

See the [LICENSE](./LICENSE.txt) file for this project's licensing. We will ask you to
confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](https://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
