const { merge } = require('webpack-merge');
const spawn = require('child_process').spawn;

const baseConfig = require('./webpack.renderer.config');

module.exports = merge(baseConfig, {
  devServer: {
    hot: true,
    port: 2003,
    compress: true,

    // noInfo: true,
    //stats: 'errors-only',
    //inline: true,
    //headers: { 'Access-Control-Allow-Origin': '*' },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false
    },
    onBeforeSetupMiddleware() {
      if (process.env.START_HOT) {
        console.log(
          '========================================================================================================='
        );
        console.log('===================================  Starting main process');
        console.log(
          '========================================================================================================='
        );
        spawn('npm', ['run', 'start-main-dev'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => process.exit(code))
          .on('error', spawnError => console.error(spawnError));
      } else {
        console.log(
          '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
        );
        console.log(
          ' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NOT NOT NOT Starting main process'
        );
        console.log(
          '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
        );
      }
    }
  }
});
