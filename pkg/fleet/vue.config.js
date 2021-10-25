const path = require('path');
const maindir = path.resolve(__dirname, '..', '..');
const dir = __dirname;
const webpack = require('webpack');

const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});


module.exports = {
  configureWebpack: (config) => {
    // console.log('>>>>>>>>>>>>>>>>>>> HELLO');
    config.resolve.alias['@shell'] = path.join(dir, '.shell');
    // config.resolve.alias['@'] = __dirname;
    config.resolve.alias['./node_modules'] = path.join(maindir, 'node_modules');
    config.resolve.alias['@/models'] = path.join(dir, '.shell/models');
    config.resolve.alias['~shell'] = path.join(dir, '.shell');

    delete config.resolve.alias['@'];

    contextFolders.forEach((f) => {
      config.resolve.alias[`@/${ f }`] = path.join(dir, '.shell', f);
    });

    // console.log(config.resolve.alias);

    // console.log(config);
    // console.log(JSON.stringify(config.module.rules, null, 2));

    // config.module.rules.push({
    //   test: /\.js$/,
    //   exclude: /node_modules/,
    //   use: {
    //     loader: "babel-loader",
    //     options: {
    //       presets: [
    //         [
    //           '@nuxt/babel-preset-app',
    //           {
    //             corejs: {
    //               version: 3
    //             },
    //             targets: {
    //               browsers: [
    //                 'last 2 versions'
    //               ]
    //             },
    //             modern: true
    //           }
    //         ],
    //         '@babel/preset-typescript'
    //       ],
    //       plugins: [
    //         [
    //           '@babel/plugin-proposal-private-property-in-object',
    //           {
    //             loose: true
    //           }
    //         ]
    //       ],
    //       configFile: false,
    //       babelrc: false,
    //       cacheDirectory: true,
    //       envName: 'client'
    //     }
    //   }
    // });

    // config.module.rules.push({
    //   test: /\.ts$/,
    //   exclude: /node_modules/,
    //   use: 'ts-loader',
    //   // options: {
    //   //   // transpileOnly: true,
    //   //   // appendTsSuffixTo: [/\.vue$/]
    //   // }
    // });

    // config.resolve.extensions.push('.ts');

    // console.log(config.resolve);
    const nmrp = new webpack.NormalModuleReplacementPlugin(/^@\//, function(resource) {

      // console.log(`REQ: ${ resource.request }`); // eslint-disable-line no-console
      // const original = resource.request;
  
      const folder = resource.request.split('/')[1];
      console.log('>> REQ: ' + resource.request);  // eslint-disable-line no-console
  
      if (contextMap[folder]) {
        resource.request = '@shell/' + resource.request.substr(2);
      }
    });

    config.plugins.unshift(nmrp);

    const SHELL = path.join(dir, '.shell');

    config.module.rules.forEach(rule => {
      if ('file.scss'.match(rule.test)) {
        rule.oneOf.forEach(r => {
          r.use.forEach(loader => {
            if (loader.loader.indexOf('sass-loader') >= 0) {
              console.log('Patched sass loader');
              loader.options.prependData = `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; `;
            }
          });
        });
      }
    });
  }
};
