const conventionalCommitTypes = require('./commit-types');

const commitlint = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', conventionalCommitTypes.map(t => t.type)]
    }
};

module.exports = commitlint;
