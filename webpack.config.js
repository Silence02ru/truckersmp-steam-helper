const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Target browser: chrome (default) or firefox. They need different "background" keys in MV3
const BROWSER = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome'
const OUTPUT_DIR = BROWSER === 'firefox' ? 'distribution-firefox' : 'distribution'

/**
 * Adapt source/manifest.json for the target browser
 * @param {Buffer} content
 * @returns {String}
 */
const transformManifest = (content) => {
  const manifest = JSON.parse(content.toString())

  if (BROWSER === 'chrome') {
    manifest.background = { service_worker: 'background.js' }
    delete manifest.browser_specific_settings
  } else {
    manifest.background = { scripts: ['background.js'] }
    delete manifest.minimum_chrome_version
  }

  return JSON.stringify(manifest, null, 2)
}

module.exports = (_env, argv) => ({
  devtool: argv.mode === 'production' ? false : 'cheap-source-map',
  stats: 'errors-warnings',
  entry: {
    background: './source/background',
    options: './source/options',
    profile: './source/contentScripts/profile',
    friends: './source/contentScripts/friends'
  },
  output: {
    path: path.join(__dirname, OUTPUT_DIR),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '**/*',
          context: 'source',
          globOptions: {
            ignore: ['**/*.js', '**/templates/**', '**/manifest.json']
          }
        },
        {
          from: 'source/manifest.json',
          to: 'manifest.json',
          transform: transformManifest
        },
        {
          from: 'node_modules/chota/dist/chota.min.css',
          to: 'css/chota.min.css'
        }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader'
      },
      {
        // Steam's CSP (default-src https: data: blob:) blocks chrome-extension:// images,
        // so icons used on Steam pages are inlined as data: URLs
        test: /\.png$/,
        type: 'asset/inline'
      }
    ]
  }
})
