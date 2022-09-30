'use strict';

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  node: {
    __dirname: true,
    __filename: false
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    alias: {
      events: require.resolve('events')
    },
    fallback: {
      events: require.resolve('events')
    }
  },
  devtool: 'inline-source-map',
  devServer: {
    hot: true
  },
  plugins: [
    // new CleanWebpackPlugin({}),
    new ReactRefreshWebpackPlugin(),

    new CopyWebpackPlugin({
      patterns: [
        { from: 'shaders', to: 'shaders' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ]
};
