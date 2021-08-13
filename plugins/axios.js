import https from 'https';
import { CSRF } from '@/config/cookies';
import { parse as setCookieParser } from 'set-cookie-parser';
import pkg from '../package.json';

// ====================================================================================================
// Debug logging for requests
const consoleLog = console.log; // eslint-disable-line no-console

console.log = () => {}; // eslint-disable-line no-console
console.error = () => {}; // eslint-disable-line no-console
console.warn = () => {}; // eslint-disable-line no-console

const logged = {};

function logRequest(config) {
  const url = config.url;
  const rel = url.replace(/^[a-z]{4,5}\:\/{2}[a-z0-9\.]{1,}\:[0-9]{1,4}(.*)/, '$1');
  const method = config.method.padEnd(6, ' ').toUpperCase();
  const msg = `${ method } ${ rel }`;

  if (!logged[msg]) {
    consoleLog(msg);
    logged[msg] = true;
  }
}
// ====================================================================================================

export default function({
  $axios, $cookies, isDev, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json';
  $axios.defaults.withCredentials = true;

  $axios.onRequest((config) => {
    const csrf = $cookies.get(CSRF, { parseJSON: false });

    if ( csrf ) {
      config.headers['x-api-csrf'] = csrf;
    }

    if ( process.server ) {
      config.headers.common['access-control-expose-headers'] = `set-cookie`;
      config.headers.common['user-agent'] = `Dashboard (Mozilla) v${ pkg.version }`;

      if ( req.headers.cookie ) {
        config.headers.common['cookies'] = req.headers.cookie;
      }

      if ( config.url.startsWith('/') ) {
        config.baseURL = `${ req.protocol || 'https' }://${ req.headers.host }`;
      }
    }
    // Debug logging for requests
    logRequest(config, req);
  });

  if ( process.server ) {
    $axios.onResponse((res) => {
      const parsed = setCookieParser(res.headers['set-cookie'] || []);

      for ( const opt of parsed ) {
        const key = opt.name;
        const value = opt.value;

        delete opt.name;
        delete opt.value;

        opt.encode = x => x;
        opt.sameSite = false;
        opt.path = '/';
        opt.secure = true;

        $cookies.set(key, value, opt);
      }
    });
  }

  if ( isDev ) {
    // https://github.com/nuxt-community/axios-module/blob/dev/lib/module.js#L78
    // forces localhost to http, for no obvious reason.
    // But we never have any reason to talk to anything plaintext.
    if ( $axios.defaults.baseURL.startsWith('http://') ) {
      $axios.defaults.baseURL = $axios.defaults.baseURL.replace(/^http:/, 'https:');
    }

    const insecureAgent = new https.Agent({ rejectUnauthorized: false });

    $axios.defaults.httpsAgent = insecureAgent;
    $axios.httpsAgent = insecureAgent;
  }
}
