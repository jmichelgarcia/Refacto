const { baseRules, testRules } = require('../eslint.js');

module.exports = {
  options: {
    tests: 'src',
  },
  use: [
    ['@neutrinojs/airbnb', {
      eslint: {
        rules: baseRules,
        baseConfig: {
          extends: [
            'plugin:eslint-comments/recommended',
          ],
          overrides: [{
            files: ['**/test-helpers/*'],
            rules: testRules,
          }],
        },
      },
    }],
    ['@neutrinojs/copy', {
      patterns: [{
        context: 'src/static',
        from: '**/*',
        to: 'static',
      }],
    }],
    '@neutrinojs/jest',
    ['@neutrinojs/node', {
      babel: {
        presets: [
          ['@babel/preset-env', {
            useBuiltIns: 'usage',
            corejs: 3,
            targets: {
              node: '10.15',
            },
          }],
        ],
      },
    }],
    (neutrino) => neutrino.config.stats('minimal'),
  ],
};

// known issue: multiple rebuilds on 'npm start' due to:
// https://github.com/webpack/webpack/issues/2983
