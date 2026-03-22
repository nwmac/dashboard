import https from 'https';
import { CSRF } from '@shell/config/cookies';
import { getBaseURL } from '@shell/config/router';

let BASE;

const SRV = 'https://mac.ui.rancher.space' 

export default function({
  $axios, store, isDev, req
}) {
  $axios.defaults.headers.common['Accept'] = 'application/json';
  $axios.defaults.withCredentials = true;

  BASE = getBaseURL();

  console.log(`Setting axios baseURL to ${ BASE }`);

  $axios.onRequest((config) => {
    const options = { parseJSON: false };
    const csrf = store.getters['cookies/get']({ key: CSRF, options });

    if (config.url.startsWith('/')) {
      const newUrl = BASE + config.url;

      console.log(`Changing request from ${ config.url } to ${ newUrl }`);
      config.url = newUrl
    } else {

      if (config.url.startsWith(SRV)) {
        const newUrl = BASE + config.url.substr(SRV.length);

        console.log(`Changing request from ${ config.url } to ${ newUrl }`);
        config.url = newUrl
      } else {
      console.log('Not changing request URL as it does not start with / ' + config.url);
      }
    }

    // Request can ask not to send the CSRF header
    if (csrf && !config.noApiCsrf) {
      config.headers['x-api-csrf'] = csrf;
    }
  });

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
