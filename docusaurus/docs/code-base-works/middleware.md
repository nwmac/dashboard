# Middleware

## Location
The definitions of middleware reside in `shell/middleware`. Middleware added to the object in `shell/nuxt/middleware.js` will be initialized at the start of the app rendering. 


## Notes
This file was generated by nuxt and will soon be redefined by hand. It's safe to add new middleware to this file.

## Pattern 
Define the middleware in a file that resides within `shell/middleware`. Then add the instantiation to the object that resides in `shell/nuxt/middleware.js`.

shell/middleware/i18n.js
```js
export default async function({
  isHMR, app, store, route, params, error, redirect
}) {
  // If middleware is called from hot module replacement, ignore it
  if (isHMR) {
    return;
  }

  await store.dispatch('i18n/init');
}
```

shell/nuxt/middleware.js
```js
...
middleware['i18n'] = require('../middleware/i18n.js')
middleware['i18n'] = middleware['i18n'].default || middleware['i18n']
...
```