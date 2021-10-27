const path = require('path');
const maindir = path.resolve(__dirname, '..', '..');
const dir = __dirname;
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const tsConfigFile = path.resolve(dir, 'tsconfig.json');

const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

module.exports = {
  chainWebpack: (context) => {
    const options = {
      analyzerMode: 'static',
      openAnalyzer: false,
    };

    context
      .plugin('webpack-bundle-analyzer')
      .use(BundleAnalyzerPlugin)
      .init(Plugin => new Plugin(options));
  },

  configureWebpack: (config) => {
    config.resolve.alias['@shell'] = path.join(dir, '.shell');
    // config.resolve.alias['@'] = __dirname;
    config.resolve.alias['./node_modules'] = path.join(maindir, 'node_modules');
    config.resolve.alias['@/models'] = path.join(dir, '.shell/models');
    config.resolve.alias['~shell'] = path.join(dir, '.shell');

    delete config.resolve.alias['@'];

    contextFolders.forEach((f) => {
      config.resolve.alias[`@/${ f }`] = path.join(dir, '.shell', f);
    });

    // console.log(config);

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
    const nmrp = new webpack.NormalModuleReplacementPlugin(/^@\//, (resource) => {
      console.log(`REQ: ${ resource.request } from ${ resource.contextInfo.issuer }`); // eslint-disable-line no-console
      // const original = resource.request;

      const folder = resource.request.split('/')[1];

      // console.log(`>> REQ: ${ resource.request }`); // eslint-disable-line no-console

      if (contextMap[folder]) {
        resource.request = `@shell/${ resource.request.substr(2) }`;
      }
    });

    const dynamicImporterOveride = new webpack.NormalModuleReplacementPlugin(/dynamic-importer$/, (resource) => {
      resource.request = path.join(dir, '.shell', 'dynamic-importer.lib.js');
    });

    const ctxOvrride = new webpack.ContextReplacementPlugin(/^@\//, (context) => {
      const folder = context.request.split('/')[1];

      if (contextMap[folder]) {
        // Just change the regx so it does not match any rsources
        context.regExp = /does-not-exist/;
      }
    });

    config.plugins.unshift(nmrp);
    config.plugins.unshift(dynamicImporterOveride);
    config.plugins.unshift(ctxOvrride);

    // TODO: Not working?
    // config.externals = {
    //   jquery: {
    //     root:      '$',
    //     commonjs2: 'jQuery',
    //     commonjs:  'jQuery'
    //   },
    //   jsrsasign: {
    //     root:      'jsrassign',
    //     commonjs2: 'jsrassign',
    //     commonjs:  'jsrassign'
    //   },
    //   jszip: {
    //     root:      'jszip',
    //     commonjs2: 'jszip',
    //     commonjs:  'jszip'
    //   },
    // };

    // console.log(config.externals);

    const SHELL = path.join(dir, '.shell');

    config.plugins.forEach((plugin) => {
      if (plugin.constructor.name === 'ForkTsCheckerWebpackPlugin') {
        // Update location of the tsconfig file
        plugin.tsconfig = tsConfigFile;
      }
    });

    config.module.rules.forEach((rule) => {
      if ('file.scss'.match(rule.test)) {
        rule.oneOf.forEach((r) => {
          r.use.forEach((loader) => {
            if (loader.loader.includes('sass-loader')) {
              loader.options.prependData = `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; `;
            }
          });
        });
      } else if ('file.js'.match(rule.test)) {
        const alt = rule.oneOf || [{ use: rule.use }];

        alt.forEach((r) => {
          r.use.forEach((loader) => {
            if (loader.loader.includes('babel-loader')) {
              loader.options = {
                presets: [
                  '@vue/cli-plugin-babel/preset'
                ]
              };
            }
          });
        });
      } else if ('file.ts'.match(rule.test)) {
        const alt = rule.oneOf || [{ use: rule.use }];

        alt.forEach((r) => {
          r.use.forEach((loader) => {
            if (loader.loader.includes('ts-loader')) {
              loader.options.configFile = tsConfigFile;
            }
          });
        });
      }
    });
  }
};
