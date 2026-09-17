# release-automation

Reusable commit and release conventions for JavaScript repositories.
This repository centralizes commitlint and release-it configuration so teams can enforce consistent commit types and generate predictable changelogs.

## Quick start

1. Install dependencies.
2. Point your tooling to the config files in this repository.
3. Run commitlint and release-it from your target project.

```bash
npm install
```

## What is included

| File | Purpose |
|------|---------|
| `commit-conventions.types.js` | Single source of truth for allowed conventional commit types and changelog sections. |
| `commit-lint.config.js` | commitlint config using `type-enum` from the shared types list. |
| `release-it.config.js` | release-it config with GitHub release creation and conventional changelog generation. |

## Conventional commit types

The accepted types are:

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

`release-it.config.js` is configured to:

- Require a clean working tree.
- Require releases from `main`.
- Create tags as `v${version}`.
- Create GitHub releases.
- Skip npm publish.
- Write changelog entries to `CHANGELOG.md` using conventional commits.

## Typical release command

Run this from the project that consumes these conventions:

```bash
npx release-it --config ./release-it.config.js
```

## Validation command

Use commitlint against the shared config:

```bash
npx commitlint --config ./commit-lint.config.js --from HEAD~1 --to HEAD
```
