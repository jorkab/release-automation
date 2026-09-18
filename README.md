# release-automation

A collection of GitHub Actions **reusable workflows** (`workflow_call`) for standardizing
commits and releases across JavaScript repositories: one lints commit messages on every
PR, the other cuts a release (tag, changelog, GitHub release) on merge to `main`.

This repo is **not a standalone action and not an installable package**. There is no
`npm install` that pulls it into another project, and it is not meant to run on its own:
the two workflows are coupled to each other (one gates the merge, the other publishes
the release) and only make sense **invoked** from the consuming repository.

## What's in this repo

| File | Role |
|---|---|
| `.github/workflows/commitlint.yml` | Reusable workflow: runs commitlint against a PR's commit range. |
| `.github/workflows/release-it.yml` | Reusable workflow: runs `release-it` (tag, changelog, GitHub release) on push to `main`. |
| `commit-conventions.types.js` | Single source of truth for allowed commit types and their changelog sections. |
| `commit-lint.config.js` | commitlint config, built on top of `commit-conventions.types.js`. |
| `release-it.config.js` | release-it config, built on top of `commit-conventions.types.js`. |

The three `.js` files are the shared defaults. Each reusable workflow checks out this
repo into `.release-automation` and runs commitlint/release-it against
`.release-automation/commit-lint.config.js` / `.release-automation/release-it.config.js`
unless the caller sets the `config-file` input — in that case, the path is resolved in
the caller's own checkout instead, so the consuming repo only needs a config file of its
own when it wants to diverge from the shared defaults.

## How it's used

The consuming repo doesn't install anything from here. It defines its own thin workflow
files that declare the real trigger and delegate the whole job with `uses:`.

`.github/workflows/commitlint.yml` in the consuming repo:

```yaml
name: Lint Commit Messages

on:
  pull_request

permissions:
  contents: read

jobs:
  commitlint:
    uses: jorkab/release-automation/.github/workflows/commitlint.yml@v2
```

`.github/workflows/release-it.yml` in the consuming repo:

```yaml
name: Release it
on:
  push:
    branches:
      - main

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    uses: jorkab/release-automation/.github/workflows/release-it.yml@v2
    secrets:
      release-token: ${{ secrets.RELEASE_TOKEN }}
```

Key points from the example:

- The **trigger** (`pull_request`, `push` to `main`) and the `permissions:` are owned by
  the consuming repo, not this one.
- **Pinning a version** (`@v2`) is mandatory in practice: point at the tag, never at
  `main`, so future changes here don't silently break your pipeline.
- `release-token` is a secret owned by the consumer (here, `RELEASE_TOKEN`) mapped to
  the name the reusable workflow expects. It must be a PAT with write access — the
  default `GITHUB_TOKEN` isn't enough if the release commit needs to trigger other
  workflows.

## Contract of each reusable workflow

### `commitlint.yml`

| Input | Default | Description |
|---|---|---|
| `node-version-file` | `.nvmrc` | Path to the Node version file, resolved in the consuming repo. |
| `config-file` | *(empty)* | Path to a commitlint config in the consuming repo. Leave empty to use the shared `.release-automation/commit-lint.config.js` default. |

Resolves the commit range from the pull request's `base.sha`/`head.sha`, or from
`github.event.before` on a push event; falls back to linting the last commit if no
usable range is found.

### `release-it.yml`

| Input / Secret | Default | Description |
|---|---|---|
| `node-version-file` | `.nvmrc` | Same as above. |
| `config-file` | *(empty)* | Path to a release-it config in the consuming repo. Leave empty to use the shared `.release-automation/release-it.config.js` default. |
| `secrets.release-token` (required) | — | Token used for checkout, tagging, and creating the GitHub release. |

Runs `release-it --ci`, which requires a clean working tree and the `main` branch.

## Overriding or extending the shared config

Both workflows check out this repo into `.release-automation/` as a sibling of the
consuming repo's own checkout, so that path is a stable contract you can point at,
not just an internal detail. There are two ways to diverge from the shared defaults
via the `config-file` input:

- **Full replace** — point `config-file` at your own config and ignore the shared
  one entirely.
- **Partial override** — write a config that `extends` the shared default and only
  overrides what you need. Both `commitlint` and `release-it` resolve `extends`
  against relative paths, not just npm package names, so this works without
  publishing anything.

`commitlint.config.js` in the consuming repo:

```js
module.exports = {
  extends: ['./.release-automation/commit-lint.config.js'],
  rules: {
    'subject-case': [0] // turn off a rule from the shared default
  }
};
```

`release-it.config.js` (or `.release-it.js`) in the consuming repo:

```js
module.exports = {
  extends: './.release-automation/release-it.config.js',
  git: {
    requireBranch: 'develop' // override one key, keep the rest
  }
};
```

Then pass the file to the reusable workflow with `config-file: commitlint.config.js`
(or `release-it.config.js`). Everything not overridden keeps coming from the shared
default in `.release-automation/`.

## Conventional commit types

The accepted types (defined in `commit-conventions.types.js`):

- `feat`
- `fix`
- `perf`
- `revert`
- `docs`
- `refactor`
- `style`
- `chore`
- `test`
- `build`
- `ci`

## Release behavior

`release-it.config.js` configures `release-it.yml` to:

- Require a clean working tree.
- Require releases from `main`.
- Create tags as `v${version}`.
- Create GitHub releases.
- Skip npm publish.
- Write changelog entries to `CHANGELOG.md` using conventional commits.

## Versioning

Tags `v1` and `v2` are the anchor points consumers reference in `uses: ...@vN`. Any
breaking change to an input, a secret, or a config file's default name requires a new
tag — never rewrite an existing one.
