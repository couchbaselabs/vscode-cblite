'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node',
  node: {
    __dirname: false
  },
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.node$/,
        exclude: /node_modules/,
        loader: "node-loader",
        options: {
          name(resourcePath, resourceQuery) {
            const parts = resourcePath.split(path.sep).slice(-2);
            const ret = parts[0] === "Windows"
              ? parts.join("\\")
              : parts.join("/");
            console.log("--- Transforming NAPI path", resourcePath, "->", ret);
            return ret;
          }
        }
      }
    ]
  }
};

module.exports = config;