const neostandard = require('neostandard')
const globals = require('globals')

module.exports = [
  ...neostandard({
    ignores: ['distribution/**', 'node_modules/**']
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
    files: ['webpack.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
]
