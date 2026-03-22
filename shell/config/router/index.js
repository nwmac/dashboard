import { createRouter, createWebHistory } from 'vue-router';
import Routes from '@shell/config/router/routes';
import { installNavigationGuards } from '@shell/config/router/navigation-guards';
import { extendRouter as ER } from '@shell/plugins/extend-router';

// Read the URL from the browser window
let baseURL = window.location.origin;
let resourceBase;
let routerBase;

const base = window.location.pathname.lastIndexOf('/dashboard');

console.log(`URL IS ${ window.location.pathname }`);
console.log('---------------');

if (base >= 0) {
  const basePath = window.location.pathname.substring(0, base);

  baseURL = window.location.origin + basePath;

  resourceBase = baseURL;
  routerBase = basePath + '/dashboard/';
}

console.log(`Setting ROUTER BASE to ${ routerBase }`);
console.log(`Setting RESOURCE BASE to ${ resourceBase }`);

const baseHref = document.createElement('base');

baseHref.href = baseURL;

if (!baseHref.href.endsWith('/')) {
  baseHref.href += '/';
}

document.getElementsByTagName('head')[0].appendChild(baseHref);

console.log(`Adding html base tag with href ${ baseHref.href }`);
console.log('---------------');

/**
 * Get the base URL for the router, which is determined from the browser window location.
 * @returns Base URL
 */
export function getBaseURL() {
  return baseURL;
}

export const routerOptions = {
  history:  createWebHistory(routerBase),
  // Note: router base comes from the ROUTER_BASE env var
  //base:     process.env.routerBase || baseURL || '/',
  base:     routerBase,
  routes:   Routes,
  fallback: false,
};

export function extendRouter(config, context) {
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = createRouter({
    ...routerOptions,
    // base,
  });

  ER(router);

  installNavigationGuards(router, context);

  return router;
}
