'use strict';

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
        extensions: ['.tsx', '.ts', '.js', '.json']
    },
    devtool : 'inline-source-map',
    module: {
        rules: {
            css: {
                modules: { auto: true },
            },
        },
    },
    plugins: [
        // new CleanWebpackPlugin({}),
        new CopyWebpackPlugin({
            patterns: [
              { from: "shaders", to: "shaders" },
              { from: "assets", to: "assets" },
            ],
          }),
    ]
};
