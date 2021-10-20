import fs from 'fs';
import https from 'https';
import path from 'path';
import webpack from 'webpack';
import serveStatic from 'serve-static'

import { STANDARD } from './config/private-label';
import { directiveSsr as t } from './plugins/i18n';
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

export default function(dir, excludes) {
  let SHELL = 'node_modules/@ranch/shell';
  let SHELL_ABS = path.join(dir, 'node_modules/@ranch/shell');
  let NUXT_SHELL = '~~node_modules/@ranch/shell';

  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL = './shell';
    SHELL_ABS = path.join(dir, 'shell');
    NUXT_SHELL = '~~/shell';
  }

  const serverMiddleware = [];

  // Find any packages in node_modules
  const NM = path.join(dir, 'node_modules');
  const pkg = require(path.join(dir, 'package.json'));
  const nmPackages = {};

  if (pkg && pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(pkg => {
      const f = require(path.join(NM, pkg, 'package.json'));
      if (f.ruif) {
        nmPackages[f.name] = f.main;

        serverMiddleware.push({
          path: '/pkg/' + f.name,
          handler: serveStatic(path.join(NM, pkg))
        });
      }
    });
  }

  const VirtualModulesPlugin = require('webpack-virtual-modules');
  let reqs = '';
  const pkgFolder = path.relative(dir, './pkg');
  if (fs.existsSync(pkgFolder)) {
    const items = fs.readdirSync(path.relative(dir, './pkg'));
  
    items.forEach(name => {
      if (!excludes || (excludes && !excludes.includes(name))) {
        reqs += `require(\'~/pkg/${name}\').default(app.router, store, $extension); `;
        console.log(name);
      }

      // Serve the code for the embedded package in case its used for dynamic loading
      if (!nmPackages[name]) {
        serverMiddleware.push({ path: `/pkg/${name}`, handler: serveStatic(dir + `/dist-pkg/${name}`) });
      }
    });
  }

  Object.keys(nmPackages).forEach(m => {
    reqs += `$extension.load('${m}', '/pkg/${m}/${nmPackages[m]}');`;
  });

  const virtualModules = new VirtualModulesPlugin({
    'node_modules/@ranch/dynamic.js': `export default function (store, app, $extension) { ${reqs} };`,
  });

  serverMiddleware.push(path.resolve(dir, SHELL, 'server', 'server-middleware'));

  // serverMiddleware.push({
  //   path: '/plugins',
  //   handler: function(req, res, next) {
  //     res.writeHead(302, {
  //       'Location': '/'
  //     });
  //     res.end();      
  //   }
  // });

  // const plugin = new webpack.NormalModuleReplacementPlugin(/^assets\//, function(resource) {
  //   if (resource.request.indexOf('assets/') === 0) {
  //     const customized = path.join('personality', resource.request);
  //     const shell = path.join(SHELL, resource.request);

  //     if (fs.existsSync(customized)) {
  //       resource.request = path.resolve(customized);
  //     } else if (fs.existsSync(shell)) {
  //       resource.request = path.resolve(shell);
  //     }
  //   }
  // });

  // console.log(SHELL); // eslint-disable-line no-console
  // console.log(SHELL_ABS); // eslint-disable-line no-console

  const ctxrp = new webpack.ContextReplacementPlugin(/^@\//, function(context) {
    const folder = context.request.split('/')[1];

    if (contextMap[folder]) {
      // console.log('>> Context Replacement >>>>>>>>>>>>>>>>>>>> ' + folder + ' '  + context.request);
      context.request = '@shell/' + context.request.substr(2);
    }
  });

  const nmrp = new webpack.NormalModuleReplacementPlugin(/^@\//, function(resource) {

    // console.log(`REQ: ${ resource.request }`); // eslint-disable-line no-console
    // const original = resource.request;

    const folder = resource.request.split('/')[1];

    if (contextMap[folder]) {
      // console.log('>> REQ: ' + resource.request);  // eslint-disable-line no-console
      resource.request = '@shell/' + resource.request.substr(2);
    }
  
    // if (resource.request.indexOf('shell') === 0) {
    //   let res = resource.request.substr(6);
    //   const resbits = res.split('?');
    //   res = resbits[0];
    //   const customized = path.join('personality', res);
    //   const shell = path.join(SHELL_ABS, res);
    //   const query = resbits.length > 1 ? `?${resbits[1]}`: '';
  
    //   if (fs.existsSync(customized)) {
    //     resource.request = path.resolve(customized) + query;
    //   } else if (fs.existsSync(shell)) {
    //     resource.request = path.resolve(shell) + query;
    //   } else {
    //     console.log('Could not find: ' + res); // eslint-disable-line no-console
    //   }
    // }
  
    // console.log('  >: ' + original + ' > ' + resource.request); // eslint-disable-line no-console
  });  

  require('events').EventEmitter.defaultMaxListeners = 20;
  require('dotenv').config();

  const version = process.env.VERSION ||
    process.env.DRONE_TAG ||
    process.env.DRONE_VERSION ||
    require('./package.json').version;

  const dev = (process.env.NODE_ENV !== 'production');
  const pl = process.env.PL || STANDARD;
  const commit = process.env.COMMIT || 'head';

  let api = process.env.API || 'http://localhost:8989';

  if ( !api.startsWith('http') ) {
    api = `https://${ api }`;
  }

  let routerBasePath = '/';
  let resourceBase = '';
  let outputDir = 'dist';

  if ( typeof process.env.ROUTER_BASE !== 'undefined' ) {
    routerBasePath = process.env.ROUTER_BASE;
  }

  if ( typeof process.env.RESOURCE_BASE !== 'undefined' ) {
    resourceBase = process.env.RESOURCE_BASE;
  }

  if ( typeof process.env.OUTPUT_DIR !== 'undefined' ) {
    outputDir = process.env.OUTPUT_DIR;
  }

  if ( resourceBase && !resourceBase.endsWith('/') ) {
    resourceBase += '/';
  }

  console.log(`Build: ${ dev ? 'Development' : 'Production' }`); // eslint-disable-line no-console

  if ( !dev ) {
    console.log(`Version: ${ version } (${ commit })`); // eslint-disable-line no-console
  }

  if ( resourceBase ) {
    console.log(`Resource Base URL: ${ resourceBase }`); // eslint-disable-line no-console
  }

  if ( routerBasePath !== '/' ) {
    console.log(`Router Base Path: ${ routerBasePath }`); // eslint-disable-line no-console
  }

  if ( pl !== STANDARD ) {
    console.log(`PL: ${ pl }`); // eslint-disable-line no-console
  }

  console.log(`API: ${ api }`); // eslint-disable-line no-console

  const config = {
    dev,

    // Configuration visible to the client, https://nuxtjs.org/api/configuration-env
    env: {
      commit,
      version,
      dev,
      pl,
    },

    buildDir: dev ? '.nuxt' : '.nuxt-prod',

    buildModules: [
      '@nuxtjs/style-resources',
      '@nuxt/typescript-build'
    ],
    styleResources: {
      // only import functions, mixins, or variables, NEVER import full styles https://github.com/nuxt-community/style-resources-module#warning
      hoistUseStatements: true,
      scss:               [
        path.resolve(SHELL_ABS, 'assets/styles/base/_variables.scss'),
        path.resolve(SHELL_ABS, 'assets/styles/base/_functions.scss'),
        path.resolve(SHELL_ABS, 'assets/styles/base/_mixins.scss'),
      ],
    },

    loadingIndicator: path.join(SHELL_ABS, 'static/loading-indicator.html'),

    // mode:    'spa', --- Use --spa CLI flag, or ?spa query param.

    loading: path.join(SHELL_ABS,'components/nav/GlobalLoading.vue'),

    // Axios: https://axios.nuxtjs.org/options
    axios: {
      https:          true,
      proxy:          true,
      retry:          { retries: 0 },
      // debug:   true
    },

    content: {
      dir: path.resolve(SHELL_ABS, 'content'),
      markdown: { prism: { theme: false } },
      liveEdit: false
    },

    router: {
      base:       routerBasePath,
      middleware: ['i18n'],
    },

    alias: {
      '~shell': SHELL_ABS,
      '@shell': SHELL_ABS,
    },

    modulesDir: [
      path.resolve(dir),
      './node_modules',
      SHELL_ABS
    ],

    dir: {
      assets:     path.join(SHELL, 'assets'),
      layouts:    path.join(SHELL, 'layouts'),
      middleware: path.join(SHELL, 'middleware'),
      pages:      path.join(SHELL, 'pages'),
      static:     path.join(SHELL, 'static'),
      store:      path.join(SHELL, 'store'),
    },

    build: {
      publicPath: resourceBase,
      parallel:   true,
      cache:      true,
      hardSource: true,

      uglify: {
        uglifyOptions: { compress: !dev },
        cache:         './node_modules/.cache/uglify'
      },

      'html.minify': {
        collapseBooleanAttributes:  !dev,
        decodeEntities:             !dev,
        minifyCSS:                  !dev,
        minifyJS:                   !dev,
        processConditionalComments: !dev,
        removeEmptyAttributes:      !dev,
        removeRedundantAttributes:  !dev,
        trimCustomFragments:        !dev,
        useShortDoctype:            !dev
      },

      filenames: { chunk: ({ isDev }) => isDev ? '[name].js' : '[name].[contenthash].js' },
      // @TODO figure out how to split chunks up better, by product
      // optimization: {
      //   splitChunks: {
      //     cacheGroups: {
      //       styles: {
      //         name:    'styles',
      //         test:    /\.(css|vue)$/,
      //         chunks:  'all',
      //         enforce: true
      //       },
      //     }
      //   }
      // },

      plugins: [
        virtualModules,
        ctxrp,
        nmrp,
      ],      

      extend(config, { isClient, isDev }) {
        if ( isDev ) {
          config.devtool = 'eval-source-map';
        } else {
          config.devtool = 'source-map';
        }

        if ( resourceBase ) {
          config.output.publicPath = resourceBase;
        }

        // Remove default image handling rules
        for ( let i = config.module.rules.length - 1 ; i >= 0 ; i-- ) {
          if ( /svg/.test(config.module.rules[i].test) ) {
            config.module.rules.splice(i, 1);
          }
        }

        config.resolve.symlinks = false;

        // Ensure we process files in the @ranch/shell folder

        config.module.rules.forEach(r => {
          if ('test.js'.match(r.test)) {
            if (r.exclude) {
              const orig = r.exclude;

              r.exclude = function(modulePath) {
                const res = orig(modulePath);

                if (modulePath.indexOf(SHELL_ABS) === 0) {
                  return false;
                }

                return orig(modulePath);
              }
            }
          }
        })

        // console.log(config.module.rules);

        // And substitue our own
        config.module.rules.unshift({
          test:    /\.(png|jpe?g|gif|svg|webp)$/,
          use:  [
            {
              loader:  'url-loader',
              options: {
                name:     '[path][name].[ext]',
                limit:    1,
                esModule: false
              },
            }
          ]
        });

        config.module.rules.unshift({
          test:    /\.ya?ml$/i,
          loader:  'js-yaml-loader',
          options: { name: '[path][name].[ext]' },
        });

        config.module.rules.unshift({
          test:    /\.csv$/i,
          loader:  'csv-loader',
          options: {
            dynamicTyping:  true,
            header:         true,
            skipEmptyLines: true
          },
        });

        // Prevent warning in log with the md files in the content folder
        config.module.rules.push({
          test:    /\.md$/,
          use:  [
            {
              loader:  'url-loader',
              options: {
                name:     '[path][name].[ext]',
                limit:    1,
                esModule: false
              },
            }
          ]
        });
      },

      // extractCSS:   true,
      cssSourceMap: true,
      babel:        {
        presets({ isServer }) {
          return [
            [
              require.resolve('@nuxt/babel-preset-app'),
              {
                // buildTarget: isServer ? 'server' : 'client',
                corejs:      { version: 3 },
                targets:     isServer ? { node: '12' } : { browsers: ['last 2 versions'] },
                modern:      !isServer
              }
            ],
            '@babel/preset-typescript',
          ];
        },
        plugins: [
          // TODO: Browser support
          // ['@babel/plugin-transform-modules-commonjs'],
          ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
        ],
      }
    },

    render: {
      bundleRenderer: {
        directives: {
          trimWhitespace,
          t,
        }
      }
    },

    // modern: true, -- now part of preset above

    generate: { dir: outputDir },

    // Global CSS
    css: [
      path.resolve(SHELL_ABS, 'assets/styles/app.scss')
    ],

    head: {
      title: process.env.npm_package_name || '',
      meta:  [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid:     'description',
          name:    'description',
          content: process.env.npm_package_description || ''
        }
      ],
      link: [{
        hid:  'icon',
        rel:  'icon',
        type: 'image/x-icon',
        href: `${ resourceBase || '/' }favicon.png`
      }]
    },

    // Nuxt modules
    modules: [
      '@nuxtjs/proxy',
      '@nuxtjs/axios',
      '@nuxtjs/eslint-module',
      '@nuxtjs/webpack-profile',
      'cookie-universal-nuxt',
      'portal-vue/nuxt',
      '~/plugins/steve/rehydrate-all',
      '@nuxt/content',
    ],

    // Vue plugins
    plugins: [
      // Extensions
      path.relative(dir, path.join(SHELL, 'extensions/extension.js')),
      path.relative(dir, path.join(SHELL, 'extensions/extension-loader.js')),
      
      // Third-party
      '~/plugins/axios',
      '~/plugins/tooltip',
      '~/plugins/vue-clipboard2',
      '~/plugins/v-select',
      '~/plugins/directives',
      '~/plugins/transitions',
      { src: '~/plugins/vue-js-modal' },
      { src: '~/plugins/js-yaml', ssr: false },
      { src: '~/plugins/resize', ssr: false },
      { src: '~/plugins/shortkey', ssr: false },

      // First-party
      '~/plugins/i18n',
      '~/plugins/global-formatters',
      '~/plugins/trim-whitespace',
      { src: '~/plugins/extend-router' },
      { src: '~/plugins/lookup', ssr: false },
      { src: '~/plugins/int-number', ssr: false },
      { src: '~/plugins/nuxt-client-init', ssr: false },
      '~/plugins/replaceall',
      '~/plugins/back-button',
    ],

    // Proxy: https://github.com/nuxt-community/proxy-module#options
    proxy: {
      '/k8s':          proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
      '/api':          proxyWsOpts(api), // Management k8s API
      '/apis':         proxyWsOpts(api), // Management k8s API
      '/v1':           proxyWsOpts(api), // Management Steve API
      '/v3':           proxyWsOpts(api), // Rancher API
      '/v3-public':    proxyOpts(api), // Rancher Unauthed API
      '/api-ui':       proxyOpts(api), // Browser API UI
      '/meta':         proxyOpts(api), // Browser API UI
      '/v1-*':         proxyOpts(api), // SAML, KDM, etc
      // These are for Ember embedding
      '/c/*/edit':     proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
      '/k/':           proxyOpts('https://127.0.0.1:8000'),
      '/g':            proxyOpts('https://127.0.0.1:8000'),
      '/n':            proxyOpts('https://127.0.0.1:8000'),
      '/p':            proxyOpts('https://127.0.0.1:8000'),
      '/assets':       proxyOpts('https://127.0.0.1:8000'),
      '/translations': proxyOpts('https://127.0.0.1:8000'),
      '/engines-dist': proxyOpts('https://127.0.0.1:8000'),
    },

    // Nuxt server
    server: {
      https: (dev ? {
        key:  fs.readFileSync(path.resolve(dir, SHELL, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(dir, SHELL, 'server/server.crt'))
      } : null),
      port:      (dev ? 8005 : 80),
      host:      '0.0.0.0',
    },

    // Server middleware
    serverMiddleware,

    // Eslint module options
    eslint: {
      cache: path.join(dir, 'node_modules/.cache/eslint'),
      exclude: [
        '.nuxt'
      ]
    },

    typescript: { typeCheck: { eslint: { files: './**/*.{ts,js,vue}' } } }
  };

  config.plugins = patch(config.plugins);
  config.modules = patch(config.modules);

  return config;

  function patch(config) {
    const update = [];

    config.forEach((c) => {
      if (c.src) {
        if (c.src.startsWith('~/plugins')) {
          c.src = path.join(NUXT_SHELL, c.src.substr(2));
        }
        update.push(c);
      } else if (c.startsWith('~/plugins')) {
        update.push(path.join(NUXT_SHELL, c.substr(2)));
      } else {
        update.push(c);
      }
    });

    return update;
  }  

  function proxyOpts(target) {
    return {
      target,
      secure: !dev,
      onProxyReq,
      onProxyReqWs,
      onError,
      onProxyRes,
    };
  }

  function onProxyRes(proxyRes, req, res) {
    if (dev) {
      proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
    }
  }

  function proxyWsOpts(target) {
    return {
      ...proxyOpts(target),
      ws:           true,
      changeOrigin: true,
    };
  }

  function onProxyReq(proxyReq, req) {
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
    // console.log(proxyReq.getHeaders());
  }

  function onProxyReqWs(proxyReq, req, socket, options, head) {
    req.headers.origin = options.target.href;
    proxyReq.setHeader('origin', options.target.href);
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
    // console.log(proxyReq.getHeaders());

    socket.on('error', (err) => {
      console.error('Proxy WS Error:', err); // eslint-disable-line no-console
    });
  }

  function onError(err, req, res) {
    // Serve up the index file
    https.get('https://127.0.0.1:8005', (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
          data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        res.statusCode = 200;
        res.write(data);
        res.end();
      });

    }).on("error", (err) => {
      res.statusCode = 598;
      console.error('Proxy Error:', err); // eslint-disable-line no-console
      res.write(JSON.stringify(err));
    });
  }
}
