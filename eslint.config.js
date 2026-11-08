const neostandard = require('neostandard')
const globals = require('globals')

module.exports = [
  ...neostandard({
    ignores: ['distribution/**', 'distribution-firefox/**', 'packages/**', 'node_modules/**']
  }),
  {
    files: ['source/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    }
  },
  {
    files: ['proxy/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['webpack.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
]
