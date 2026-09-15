# release-automation

Single home for the release-automation tooling shared across repos: reusable GitHub Actions workflows for commit-message linting and releases, plus the `commit-conventions` npm package that keeps their commit-type lists in sync.

This repo replaces two previously separate repos, `gha-shared` and `commit-conventions` — both concerns now live here, in one place, so the whole setup is easier to share with the team and install in other repos.

## Reusable workflows

Caller repo, on pull requests:

```yaml
name: Lint Commit Messages

on:
  pull_request:

permissions:
  contents: read

jobs:
  commitlint:
    uses: jorkab/release-automation/.github/workflows/commitlint.yml@v1
    with:
      config-file: commitlint.config.js
```

Caller repo, on push to `main`:

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
    uses: jorkab/release-automation/.github/workflows/release-it.yml@v1
    with:
      config-file: release-it.config.js
    secrets:
      release-token: ${{ secrets.MY_RELEASE_PLEASE_TOKEN }}
```

Both workflows expect the caller repo to provide:

- `.nvmrc` (or pass `node-version-file` as a different path)
- a `commitlint.config.js` and a `release-it.config.js` (or pass `config-file` as different paths), each exporting a config derived from [`commit-conventions`](#commit-conventions) (published on npm as `commit-conventions`, unscoped — currently `1.0.1`)
- `npm ci` must succeed, i.e. `package-lock.json` committed and any private dependency reachable without extra auth

### Config file shape

Both workflows point at a config file. `commitlint.yml` sets `ACTION_CONFIG=commitlint` when it runs, `release-it.yml` doesn't set it — so a single file can export either config depending on which workflow is calling it:

```js
const { commitlint, releaseIt } = require("commit-conventions");

module.exports = process.env.ACTION_CONFIG === "commitlint" ? commitlint : releaseIt;
```

> Each tool's `--config` flag expects the file it points to export a single config object, so `commitlint` and `release-it` need separate files even though both can re-export from the same source, as shown above.

And the caller's `package.json` needs `commit-conventions` as a `devDependency`:

```json
{
  "devDependencies": {
    "commit-conventions": "1.0.1"
  }
}
```

## commit-conventions

Shared source of truth for Conventional Commit types, consumed by both [commitlint](https://commitlint.js.org/) and [release-it](https://github.com/release-it/release-it)'s [conventional-changelog plugin](https://github.com/release-it/conventional-changelog). Lives in [`commit-conventions/`](./commit-conventions) and is published to npm under the same package name.

### Why

`commitlint` validates that commit messages use an allowed `type`, and `release-it` groups commits by `type` into changelog sections. Without a shared source, those two type lists drift apart: a `type` gets added to lint rules but forgotten in the changelog preset (or vice versa), and commits silently disappear from — or get rejected by — one tool but not the other.

This package defines the commit types once and derives both configs from it, so they can never disagree.

### Installation

```bash
npm install --save-dev commit-conventions
```

### Usage

The package exports two ready-to-use configs:

```js
const { commitlint, releaseIt } = require('commit-conventions');
```

```js
// commitlint.config.js
module.exports = require('commit-conventions').commitlint;
```

```js
// release-it.config.js
module.exports = require('commit-conventions').releaseIt;
```

### Commit types

| Type | Changelog section | In changelog |
|---|---|---|
| `feat` | Features | yes |
| `fix` | Bug Fixes | yes |
| `perf` | Performance Improvements | yes |
| `revert` | Reverts | yes |
| `docs` | Documentation | yes |
| `refactor` | Code Refactoring | yes |
| `style` | — | hidden |
| `chore` | — | hidden |
| `test` | — | hidden |
| `build` | — | hidden |
| `ci` | — | hidden |

Hidden types are still valid commits — `commitlint` accepts them — they're just omitted from the generated `CHANGELOG.md`.

### Publishing

There's no publish automation yet — releasing a new version of the npm package is manual, run from its subfolder:

```bash
cd commit-conventions
npm publish
```

## Versioning

Pin callers to a tag (`@v1`), not `@main` — an unpinned reference means any future change to this repo silently changes behavior in every consuming repo.
