const path = require('path');
const dir = path.resolve(__dirname);
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove'];
// const contextMap = contextFolders.reduce((map, obj) => {
//   map[obj] = true;

//   return map;
// }, {});

const nmrp = new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
  // console.log(`REQ: ${ resource.request } from ${ resource.contextInfo.issuer }`); // eslint-disable-line no-console
  console.log(`REQ: ${ resource.request }`); // eslint-disable-line no-console

  const corejs = '/Users/nwm/dev/monday/try4/dashboard/node_modules/core-js';

  if (resource.request.indexOf(corejs) === 0) {
    resource.request = resource.request.substr(corejs.length - 7);
    // console.log(resource.request); // eslint-disable-line no-console
  }
});

module.exports = {
  chainWebpack: (config) => {
    const options = {
      analyzerMode: 'static',
      openAnalyzer: false,
    };

    config
      .plugin('webpack-bundle-analyzer')
      .use(BundleAnalyzerPlugin)
      .init(Plugin => new Plugin(options));

    // ['js', 'vue', 'ts', 'tsx'].forEach((rule) => {
    //   config.module
    //     .rule(rule)
    //     .use('babel')
    //     .loader('babel-loader')
    //     .tap(options => {
    //       options = { presets: [[
    //         '@vue/cli-plugin-babel/preset',
    //         { useBuiltIns: false }
    //       ]] };
    //     });
    //   });
  },

  configureWebpack: (config) => {
    config.resolve.alias['@shell'] = path.join(dir, '.shell');
    // config.resolve.alias['./node_modules'] = path.join(dir, 'node_modules');
    config.resolve.alias['@/models'] = path.join(dir, '.shell/models');
    config.resolve.alias['~shell'] = path.join(dir, '.shell');

    delete config.resolve.alias['@'];

    contextFolders.forEach((f) => {
      config.resolve.alias[`@/${ f }`] = path.join(dir, '.shell', f);
    });

    config.externals = {
      jquery:    '$',
      jszip:     '__jszip',
      'js-yaml': '__jsyaml'
    };

    config.plugins.unshift(nmrp);

    // console.log(config);
  }
};
