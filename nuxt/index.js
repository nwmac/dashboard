import Vue from 'vue'
import Vuex from 'vuex'
import Meta from 'vue-meta'
import ClientOnly from 'vue-client-only'
import NoSsr from 'vue-no-ssr'
import { createRouter } from './router.js'
import NuxtError from '../layouts/error.vue'
import Nuxt from './components/nuxt.js'
import App from './App.vue'
import { setContext, getLocation, getRouteData, normalizeError } from './utils'
import { createStore } from './store.js'
import PortalVue from 'portal-vue'

Vue.use(PortalVue)

/* Plugins */

import nuxt_plugin_content from './content/plugin.client' // Source: ./content/plugin.client.js (mode: 'client')
import nuxt_plugin_cookieuniversalnuxt_a6ec4aa2 from './cookie-universal-nuxt.js' // Source: ./cookie-universal-nuxt.js (mode: 'all')
import nuxt_plugin_axios_285d2907 from './axios.js' // Source: ./axios.js (mode: 'all')
import nuxt_plugin_axios_3566aa80 from '../plugins/axios' // Source: ../plugins/axios (mode: 'all')
require('../plugins/tooltip');
import '../plugins/vue-clipboard2'
import '../plugins/v-select' // Source:  (mode: 'all')
require('../plugins/directives'); // Source: ../plugins/directives (mode: 'all')
import '../plugins/transitions' // Source: ../plugins/transitions (mode: 'all')
import '../plugins/vue-js-modal' // Source: ../plugins/vue-js-modal (mode: 'all')
import '../plugins/js-yaml' // Source: ../plugins/js-yaml (mode: 'client')
import '../plugins/resize' // Source: ../plugins/resize (mode: 'client')
require('../plugins/shortkey');
require('../plugins/i18n'); // Source: ../plugins/i18n (mode: 'all')
require('../plugins/global-formatters'); // Source: ../plugins/global-formatters (mode: 'all')
require('../plugins/trim-whitespace'); // Source: ../plugins/trim-whitespace (mode: 'all')
require('../plugins/extend-router'); // Source: ../plugins/extend-router (mode: 'all')
import nuxt_plugin_lookup_52dc5720 from '../plugins/lookup' // Source: ../plugins/lookup (mode: 'client')
import nuxt_plugin_intnumber_da871a46 from '../plugins/int-number' // Source: ../plugins/int-number (mode: 'client')
import nuxt_plugin_nuxtclientinit_181bd504 from '../plugins/nuxt-client-init' // Source: ../plugins/nuxt-client-init (mode: 'client')
import nuxt_plugin_replaceall_40dd1a63 from '../plugins/replaceall' // Source: ../plugins/replaceall (mode: 'all')
import nuxt_plugin_backbutton_0c6bc9a2 from '../plugins/back-button' // Source: ../plugins/back-button (mode: 'all')

// Component: <ClientOnly>
Vue.component(ClientOnly.name, ClientOnly)

// TODO: Remove in Nuxt 3: <NoSsr>
Vue.component(NoSsr.name, {
  ...NoSsr,
  render (h, ctx) {
    if (process.client && !NoSsr._warned) {
      NoSsr._warned = true

      console.warn('<no-ssr> has been deprecated and will be removed in Nuxt 3, please use <client-only> instead')
    }
    return NoSsr.render(h, ctx)
  }
})

// Component NuxtLink is imported in server.js or client.js

// Component: <Nuxt>
Vue.component(Nuxt.name, Nuxt)

Vue.use(Meta, {"keyName":"head","attribute":"data-n-head","ssrAttribute":"data-n-head-ssr","tagIDKeyName":"hid"})

const defaultTransition = {"name":"page","mode":"out-in","appear":true,"appearClass":"appear","appearActiveClass":"appear-active","appearToClass":"appear-to"}

const originalRegisterModule = Vuex.Store.prototype.registerModule
const baseStoreOptions = { preserveState: process.client }

function registerModule (path, rawModule, options = {}) {
  return originalRegisterModule.call(this, path, rawModule, { ...baseStoreOptions, ...options })
}

async function createApp(ssrContext, config = {}) {
  const router = await createRouter(ssrContext)

  const store = createStore(ssrContext)
  // Add this.$router into store actions/mutations
  store.$router = router

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    head: {"title":"dashboard","meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width, initial-scale=1"},{"hid":"description","name":"description","content":"Rancher Dashboard"}],"link":[{"hid":"icon","rel":"icon","type":"image\u002Fx-icon","href":"\u002Ffavicon.png"}],"style":[],"script":[]},

    store,
    router,
    nuxt: {
      defaultTransition,
      transitions: [defaultTransition],
      setTransitions (transitions) {
        if (!Array.isArray(transitions)) {
          transitions = [transitions]
        }
        transitions = transitions.map((transition) => {
          if (!transition) {
            transition = defaultTransition
          } else if (typeof transition === 'string') {
            transition = Object.assign({}, defaultTransition, { name: transition })
          } else {
            transition = Object.assign({}, defaultTransition, transition)
          }
          return transition
        })
        this.$options.nuxt.transitions = transitions
        return transitions
      },

      err: null,
      dateErr: null,
      error (err) {
        err = err || null
        app.context._errored = Boolean(err)
        err = err ? normalizeError(err) : null
        let nuxt = app.nuxt // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207
        if (this) {
          nuxt = this.nuxt || this.$options.nuxt
        }
        nuxt.dateErr = Date.now()
        nuxt.err = err
        // Used in src/server.js
        if (ssrContext) {
          ssrContext.nuxt.error = err
        }
        return err
      }
    },
    ...App
  }

  // Make app available into store via this.app
  store.app = app

  const next = ssrContext ? ssrContext.next : location => app.router.push(location)
  // Resolve route
  let route
  if (ssrContext) {
    route = router.resolve(ssrContext.url).route
  } else {
    const path = getLocation(router.options.base, router.options.mode)
    route = router.resolve(path).route
  }

  // Set context to app.context
  await setContext(app, {
    store,
    route,
    next,
    error: app.nuxt.error.bind(app),
    payload: ssrContext ? ssrContext.payload : undefined,
    req: ssrContext ? ssrContext.req : undefined,
    res: ssrContext ? ssrContext.res : undefined,
    beforeRenderFns: ssrContext ? ssrContext.beforeRenderFns : undefined,
    ssrContext
  })

  function inject(key, value) {
    if (!key) {
      throw new Error('inject(key, value) has no key provided')
    }
    if (value === undefined) {
      throw new Error(`inject('${key}', value) has no value provided`)
    }

    key = '$' + key
    // Add into app
    app[key] = value
    // Add into context
    if (!app.context[key]) {
      app.context[key] = value
    }

    // Add into store
    store[key] = app[key]

    // Check if plugin not already installed
    const installKey = '__nuxt_' + key + '_installed__'
    if (Vue[installKey]) {
      return
    }
    Vue[installKey] = true
    // Call Vue.use() to install the plugin into vm
    Vue.use(() => {
      if (!Object.prototype.hasOwnProperty.call(Vue.prototype, key)) {
        Object.defineProperty(Vue.prototype, key, {
          get () {
            return this.$root.$options[key]
          }
        })
      }
    })
  }

  // Inject runtime config as $config
  inject('config', config)

  if (process.client) {
    // Replace store state before plugins execution
    if (window.__NUXT__ && window.__NUXT__.state) {
      store.replaceState(window.__NUXT__.state)
    }
  }

  // Add enablePreview(previewData = {}) in context for plugins
  if (process.static && process.client) {
    app.context.enablePreview = function (previewData = {}) {
      app.previewData = Object.assign({}, previewData)
      inject('preview', previewData)
    }
  }

  // Plugin execution - initialize plugins that need to be
  // Some plugins just need to be imported, some expose a default function that needs to be called

  if (process.client && typeof nuxt_plugin_content === 'function') {
    await nuxt_plugin_content(app.context, inject)
  }

  if (typeof nuxt_plugin_portalvue_6ee94fac === 'function') {
    await nuxt_plugin_portalvue_6ee94fac(app.context, inject)
  }

  if (typeof nuxt_plugin_cookieuniversalnuxt_a6ec4aa2 === 'function') {
    await nuxt_plugin_cookieuniversalnuxt_a6ec4aa2(app.context, inject)
  }

  if (typeof nuxt_plugin_axios_285d2907 === 'function') {
    await nuxt_plugin_axios_285d2907(app.context, inject)
  }

  if (typeof nuxt_plugin_axios_3566aa80 === 'function') {
    await nuxt_plugin_axios_3566aa80(app.context, inject)
  }

  if (typeof nuxt_plugin_tooltip_ba49f866 === 'function') {
    await nuxt_plugin_tooltip_ba49f866(app.context, inject)
  }

  if (typeof nuxt_plugin_vueclipboard2_3c353cf9 === 'function') {
    await nuxt_plugin_vueclipboard2_3c353cf9(app.context, inject)
  }

  if (typeof nuxt_plugin_vselect_294cd8ae === 'function') {
    await nuxt_plugin_vselect_294cd8ae(app.context, inject)
  }

  if (typeof nuxt_plugin_directives_d0867c0c === 'function') {
    await nuxt_plugin_directives_d0867c0c(app.context, inject)
  }

  if (typeof nuxt_plugin_transitions_4f4e7c88 === 'function') {
    await nuxt_plugin_transitions_4f4e7c88(app.context, inject)
  }

  if (typeof nuxt_plugin_vuejsmodal_26c7eee7 === 'function') {
    await nuxt_plugin_vuejsmodal_26c7eee7(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_jsyaml_d5d8af16 === 'function') {
    await nuxt_plugin_jsyaml_d5d8af16(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_resize_3f7870ac === 'function') {
    await nuxt_plugin_resize_3f7870ac(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_shortkey_42a5844e === 'function') {
    await nuxt_plugin_shortkey_42a5844e(app.context, inject)
  }

  if (typeof nuxt_plugin_i18n_6a80ea94 === 'function') {
    await nuxt_plugin_i18n_6a80ea94(app.context, inject)
  }

  if (typeof nuxt_plugin_globalformatters_359a86c6 === 'function') {
    await nuxt_plugin_globalformatters_359a86c6(app.context, inject)
  }

  if (typeof nuxt_plugin_trimwhitespace_299ce25c === 'function') {
    await nuxt_plugin_trimwhitespace_299ce25c(app.context, inject)
  }

  if (typeof nuxt_plugin_extendrouter_516ab4b4 === 'function') {
    await nuxt_plugin_extendrouter_516ab4b4(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_lookup_52dc5720 === 'function') {
    await nuxt_plugin_lookup_52dc5720(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_intnumber_da871a46 === 'function') {
    await nuxt_plugin_intnumber_da871a46(app.context, inject)
  }

  if (process.client && typeof nuxt_plugin_nuxtclientinit_181bd504 === 'function') {
    await nuxt_plugin_nuxtclientinit_181bd504(app.context, inject)
  }

  if (typeof nuxt_plugin_replaceall_40dd1a63 === 'function') {
    await nuxt_plugin_replaceall_40dd1a63(app.context, inject)
  }

  if (typeof nuxt_plugin_backbutton_0c6bc9a2 === 'function') {
    await nuxt_plugin_backbutton_0c6bc9a2(app.context, inject)
  }

  // Lock enablePreview in context
  if (process.static && process.client) {
    app.context.enablePreview = function () {
      console.warn('You cannot call enablePreview() outside a plugin.')
    }
  }

  // If server-side, wait for async component to be resolved first
  if (process.server && ssrContext && ssrContext.url) {
    await new Promise((resolve, reject) => {
      router.push(ssrContext.url, resolve, (err) => {
        // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
        if (!err._isRouter) return reject(err)
        if (err.type !== 2 /* NavigationFailureType.redirected */) return resolve()

        // navigated to a different route in router guard
        const unregister = router.afterEach(async (to, from) => {
          ssrContext.url = to.fullPath
          app.context.route = await getRouteData(to)
          app.context.params = to.params || {}
          app.context.query = to.query || {}
          unregister()
          resolve()
        })
      })
    })
  }

  return {
    store,
    app,
    router
  }
}

export { createApp, NuxtError }
