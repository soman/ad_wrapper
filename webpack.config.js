var path = require('path'),
    webpack = require('webpack');

module.exports = {
  entry: [
    './src/toh_header.js',
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'toh_header.js'
  },
  module : {
    noParse: [
      /[\/\\]src[\/\\]global\.js$/
    ]
  }
};

