const path = require('path');

module.exports = {
  mode: 'development',
  // エントリポイントの定義
  entry: {
    app: ['@babel/polyfill', path.join(__dirname, 'src/app.js')],
  },
  // 出力先の定義
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    // モジュール解決定義
    modules: ['node_modules', path.resolve(__dirname, 'src')],
  },
  devtool: 'inline-source-map',
  module: {
    // babel の実行定義
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    ],
  },
};