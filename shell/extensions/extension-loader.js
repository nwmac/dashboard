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
}
