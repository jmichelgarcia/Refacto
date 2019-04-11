// These options are imported by each subproject's .neutrinorc.js file and used
// to configure the linter. This builds on top of the airbnb standard rules.

module.exports = {
  baseRules: {
    'arrow-parens': ['error', 'always'],
    'operator-linebreak': ['error', 'after'],
  },

  reactRules: {
    'jsx-a11y/anchor-is-valid': ['error', {
      'components': ['Link'],
      'specialLink': ['to'],
    }],
    'jsx-a11y/no-autofocus': ['error', {
      'ignoreNonDOM': false,
    }],
    'react/jsx-one-expression-per-line': ['off'], // too buggy
    'react-hooks/rules-of-hooks': ['error'],

    // https://github.com/evcohen/eslint-plugin-jsx-a11y/issues/455#issuecomment-403105932
    'jsx-a11y/label-has-associated-control': ['error', { depth: 2 }],
    'jsx-a11y/label-has-for': ['off'],

    // https://github.com/facebook/react/issues/14920#issuecomment-471328990
    'react-hooks/exhaustive-deps': ['off'], // does not support spread yet
  },

  testRules: {
    'import/no-extraneous-dependencies': ['error', {
      'devDependencies': true,
    }],
  },
};
