const conventionalCommitTypes = require('./commit-types');

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

module.exports = releaseIt;
