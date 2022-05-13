const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';

let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}

module.exports = {
  pages: {
    index: {
      entry:    'nuxt/client.js',
      template: 'nuxt/index.html',
      filename: 'index.html',
    }
  },

  css: {
    loaderOptions: {
      scss: {
        prependData: `@use 'sass:math'; @import '@/assets/styles/base/_variables.scss'; @import '@/assets/styles/base/_functions.scss'; @import '@/assets/styles/base/_mixins.scss';`
      }
    }
  },

  configureWebpack: function(config) {
    config.resolve.alias['@'] = __dirname;
    config.resolve.alias['~'] = __dirname;
    config.resolve.alias['~assets'] = path.join(__dirname, 'assets');

    config.resolve.alias['./node_modules'] = path.join(__dirname, 'node_modules');


    config.resolve.alias['process'] = path.join(__dirname, 'nuxt', 'process');

    console.log(config.resolve.alias);

    config.resolve.modules.push(__dirname);

    console.log(config.resolve);

    // config.plugins.push(
    //   new webpack.ProvidePlugin({
    //     'process': 'process'
    //   })
    // );
    //   new webpack.DefinePlugin({
    //     process: {
    //       client: false
    //     }
    //   })
    // );

    // Add loader for yaml files - used for translations
    config.module.rules.unshift({
      test:    /assets\/.*\.ya?ml$/i,
      loader:  'js-yaml-loader',
      options: { name: '[path][name].[ext]' },
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

    // const nmrp = new webpack.NormalModuleReplacementPlugin(/^~/, function(r) {
    //   console.log('!!!!!' + r.request);
    // });

    // config.plugins.push(nmrp);

    // config.module.rules.forEach(rule => {
    //   if ('file.scss'.match(rule.test)) {
    //     rule.oneOf.forEach(r => {
    //       r.use.forEach(loader => {
    //         if (loader.loader.indexOf('sass-loader') >= 0) {
    //           console.log('Patched sass loader');
    //           //loader.options.additionalData = `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; `;

    //           loader.options.sassOptions = {
    //             importer: function(url, prev, done) {
    //               if (url.indexOf('~assets') === 0) {
    //                 console.log(url);
    //               }
    //               done(null);
    //             }
    //           }
    //         }
    //       });
    //     });
    //   }
    // });
  },

  devServer: {
    https: (devPorts ? {
      key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
    } : null),
    port:      (devPorts ? 8005 : 80),
    host:      '0.0.0.0',

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
    }
  }
};

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
  res.statusCode = 598;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}
