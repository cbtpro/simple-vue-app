const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './src/index.js',
    mode: isProd ? 'production' : 'development',
    devServer: {
      static: './dist',
      port: 3000,
      hot: true
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
      }),
    ],
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      ...(isProd ? { publicPath: '/simple-vue-app' } : {}),
    }
  };
};
