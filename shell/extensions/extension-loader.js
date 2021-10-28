import Vue from 'vue';
import JSZip from 'jszip';

// Load any plugins that are present as npm modules
// The 'dynamic' module is generated in webpack to load each package

const dynamicLoader = require('@ranch/dynamic');

export default function({
  app,
  store,
  $axios,
  redirect,
  $extension,
  nuxt
}, inject) {
  if (dynamicLoader) {
    dynamicLoader.default(store, app, $extension);
  }

  // The libraries we build have Vue externalised, so we need to expose Vue as a global for
  // them to pick up - see: https://cli.vuejs.org/guide/build-targets.html#library
  window.Vue = Vue;

  // Global jszip
  window.__jszip = JSZip;
}
