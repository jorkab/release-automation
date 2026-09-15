// Single source of truth for which commit types are valid conventional commits.
// Both commitlint (type-enum rule) and release-it (changelog preset) read from this array.
const conventionalCommitTypes = [
    {"type": "feat", "section": "Features"},
    {"type": "fix", "section": "Bug Fixes"},
    {"type": "perf", "section": "Performance Improvements"},
    {"type": "revert", "section": "Reverts" },
    {"type": "docs", "section": "Documentation"},
    {"type": "refactor", "section": "Code Refactoring"},
    {"type": "style", "hidden": true },
    {"type": "chore", "hidden": true },
    {"type": "test", "hidden": true },
    {"type": "build", "hidden": true },
    {"type": "ci", "hidden": true }
]

const commitlint = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', conventionalCommitTypes.map(t => t.type)]
    }
};

const releaseIt = {
    "git":{
        "requireCleanWorkingDir": true,
        "requireBranch": "main",
        "commitMessage": "chore(release): v${version} [skip ci]",
        "tagName": "v${version}"
    },
    "github": {
        "release": true,
        "releaseName": "v${version}"
    },
    "npm": {
        "publish": false
    },
    "plugins": {
        "@release-it/conventional-changelog": {
            "preset": {
                "name": "conventionalcommits",
                "types": conventionalCommitTypes
            },
            "infile": "CHANGELOG.md"
        }
    }
}

module.exports = { commitlint, releaseIt }
