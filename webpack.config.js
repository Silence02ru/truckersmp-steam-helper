const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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
    path: path.join(__dirname, 'distribution'),
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
            ignore: ['**/*.js', '**/templates/**']
          }
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
      }
    ]
  }
})
