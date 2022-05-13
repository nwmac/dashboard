import Vue from 'vue'
import Router from 'vue-router'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _84a2a61c = () => interopDefault(import('../pages/about.vue' /* webpackChunkName: "pages/about" */))
const _2e35b556 = () => interopDefault(import('../pages/account/index.vue' /* webpackChunkName: "pages/account/index" */))
const _4a8f4dcb = () => interopDefault(import('../pages/c/index.vue' /* webpackChunkName: "pages/c/index" */))
const _e23f7a32 = () => interopDefault(import('../pages/clusters/index.vue' /* webpackChunkName: "pages/clusters/index" */))
const _1ddd0574 = () => interopDefault(import('../pages/design-system/index.vue' /* webpackChunkName: "pages/design-system/index" */))
const _d2c11bb6 = () => interopDefault(import('../pages/fail-whale.vue' /* webpackChunkName: "pages/fail-whale" */))
const _49bb45ec = () => interopDefault(import('../pages/home.vue' /* webpackChunkName: "pages/home" */))
const _7dc23ad6 = () => interopDefault(import('../pages/prefs.vue' /* webpackChunkName: "pages/prefs" */))
const _6acef877 = () => interopDefault(import('../pages/support/index.vue' /* webpackChunkName: "pages/support/index" */))
const _15a7e99b = () => interopDefault(import('../pages/account/create-key.vue' /* webpackChunkName: "pages/account/create-key" */))
const _6a2658ad = () => interopDefault(import('../pages/auth/login.vue' /* webpackChunkName: "pages/auth/login" */))
const _27b5c576 = () => interopDefault(import('../pages/auth/logout.vue' /* webpackChunkName: "pages/auth/logout" */))
const _2d80f9c1 = () => interopDefault(import('../pages/auth/setup.vue' /* webpackChunkName: "pages/auth/setup" */))
const _07dd28e5 = () => interopDefault(import('../pages/auth/verify.vue' /* webpackChunkName: "pages/auth/verify" */))
const _751d38da = () => interopDefault(import('../pages/design-system/form-controls.vue' /* webpackChunkName: "pages/design-system/form-controls" */))
const _bcb0b370 = () => interopDefault(import('../pages/design-system/provider-images.vue' /* webpackChunkName: "pages/design-system/provider-images" */))
const _14e7e8af = () => interopDefault(import('../pages/rio/mesh.vue' /* webpackChunkName: "pages/rio/mesh" */))
const _9f57cf00 = () => interopDefault(import('../pages/design-system/page-examples/create.vue' /* webpackChunkName: "pages/design-system/page-examples/create" */))
const _20f2dd55 = () => interopDefault(import('../pages/design-system/page-examples/detail.vue' /* webpackChunkName: "pages/design-system/page-examples/detail" */))
const _08505222 = () => interopDefault(import('../pages/design-system/page-examples/list.vue' /* webpackChunkName: "pages/design-system/page-examples/list" */))
const _4e2e43d5 = () => interopDefault(import('../pages/c/_cluster/index.vue' /* webpackChunkName: "pages/c/_cluster/index" */))
const _31430ab2 = () => interopDefault(import('../pages/docs/_doc.vue' /* webpackChunkName: "pages/docs/_doc" */))
const _34dbd482 = () => interopDefault(import('../pages/c/_cluster/apps/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/index" */))
const _d3444790 = () => interopDefault(import('../pages/c/_cluster/auth/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/index" */))
const _151fdadc = () => interopDefault(import('../pages/c/_cluster/backup/index.vue' /* webpackChunkName: "pages/c/_cluster/backup/index" */))
const _2d59ff93 = () => interopDefault(import('../pages/c/_cluster/cis/index.vue' /* webpackChunkName: "pages/c/_cluster/cis/index" */))
const _5ed9fbd5 = () => interopDefault(import('../pages/c/_cluster/ecm/index.vue' /* webpackChunkName: "pages/c/_cluster/ecm/index" */))
const _675ef8e2 = () => interopDefault(import('../pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/index" */))
const _d3a37fd8 = () => interopDefault(import('../pages/c/_cluster/fleet/index.vue' /* webpackChunkName: "pages/c/_cluster/fleet/index" */))
const _8222ffe6 = () => interopDefault(import('../pages/c/_cluster/gatekeeper/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/index" */))
const _5aea4d1c = () => interopDefault(import('../pages/c/_cluster/harvester/index.vue' /* webpackChunkName: "pages/c/_cluster/harvester/index" */))
const _6a9d4947 = () => interopDefault(import('../pages/c/_cluster/harvesterManager/index.vue' /* webpackChunkName: "pages/c/_cluster/harvesterManager/index" */))
const _00cd7b76 = () => interopDefault(import('../pages/c/_cluster/istio/index.vue' /* webpackChunkName: "pages/c/_cluster/istio/index" */))
const _1475f3d9 = () => interopDefault(import('../pages/c/_cluster/legacy/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/index" */))
const _2dd263b6 = () => interopDefault(import('../pages/c/_cluster/logging/index.vue' /* webpackChunkName: "pages/c/_cluster/logging/index" */))
const _2c7dcd62 = () => interopDefault(import('../pages/c/_cluster/longhorn/index.vue' /* webpackChunkName: "pages/c/_cluster/longhorn/index" */))
const _512288f3 = () => interopDefault(import('../pages/c/_cluster/manager/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/index" */))
const _51164b50 = () => interopDefault(import('../pages/c/_cluster/mcapps/index.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/index" */))
const _56132f18 = () => interopDefault(import('../pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/index" */))
const _f8494b1a = () => interopDefault(import('../pages/c/_cluster/settings/index.vue' /* webpackChunkName: "pages/c/_cluster/settings/index" */))
const _4df3a818 = () => interopDefault(import('../pages/c/_cluster/apps/charts/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/index" */))
const _0846024f = () => interopDefault(import('../pages/c/_cluster/auth/config/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/index" */))
const _9830d634 = () => interopDefault(import('../pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/index" */))
const _0c5a8c9b = () => interopDefault(import('../pages/c/_cluster/explorer/tools/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/index" */))
const _27547a18 = () => interopDefault(import('../pages/c/_cluster/gatekeeper/constraints/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/constraints/index" */))
const _4484ee48 = () => interopDefault(import('../pages/c/_cluster/harvester/support/index.vue' /* webpackChunkName: "pages/c/_cluster/harvester/support/index" */))
const _9afe4d3a = () => interopDefault(import('../pages/c/_cluster/legacy/project/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/index" */))
const _faa0ade0 = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/index" */))
const _b9548aba = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/index" */))
const _4a7b11e0 = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/index" */))
const _f5dfcab0 = () => interopDefault(import('../pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "pages/c/_cluster/settings/brand" */))
const _47541db8 = () => interopDefault(import('../pages/c/_cluster/apps/charts/chart.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/chart" */))
const _0e4e64e1 = () => interopDefault(import('../pages/c/_cluster/apps/charts/install.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/install" */))
const _4e66bb7e = () => interopDefault(import('../pages/c/_cluster/auth/group.principal/assign-edit.vue' /* webpackChunkName: "pages/c/_cluster/auth/group.principal/assign-edit" */))
const _007d02bc = () => interopDefault(import('../pages/c/_cluster/legacy/project/pipelines.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/pipelines" */))
const _0a0c78a4 = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/create.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/create" */))
const _21d4370a = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/create" */))
const _2c9b74de = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/create" */))
const _2d0377ec = () => interopDefault(import('../pages/c/_cluster/explorer/tools/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/pages/_page" */))
const _e2836712 = () => interopDefault(import('../pages/c/_cluster/auth/config/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/_id" */))
const _33100eac = () => interopDefault(import('../pages/c/_cluster/legacy/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/pages/_page" */))
const _1b421dff = () => interopDefault(import('../pages/c/_cluster/legacy/project/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/_page" */))
const _6596a110 = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/_id.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/_id" */))
const _5202d244 = () => interopDefault(import('../pages/c/_cluster/manager/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/manager/pages/_page" */))
const _0a69c3e9 = () => interopDefault(import('../pages/c/_cluster/mcapps/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/pages/_page" */))
const _63640c48 = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/_id" */))
const _1893f90c = () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/create" */))
const _3c53de44 = () => interopDefault(import('../pages/c/_cluster/harvester/console/_uid/serial.vue' /* webpackChunkName: "pages/c/_cluster/harvester/console/_uid/serial" */))
const _1a3ec10b = () => interopDefault(import('../pages/c/_cluster/harvester/console/_uid/vnc.vue' /* webpackChunkName: "pages/c/_cluster/harvester/console/_uid/vnc" */))
const _61a9632c = () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/_id" */))
const _687d4006 = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/_namespace/_id" */))
const _54b98afc = () => interopDefault(import('../pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "pages/c/_cluster/navlinks/_group" */))
const _a4987480 = () => interopDefault(import('../pages/c/_cluster/_product/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/index" */))
const _1c96d24a = () => interopDefault(import('../pages/c/_cluster/_product/members/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/members/index" */))
const _2b660f7a = () => interopDefault(import('../pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/namespaces" */))
const _71d9c074 = () => interopDefault(import('../pages/c/_cluster/_product/projectsnamespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/projectsnamespaces" */))
const _b852afc4 = () => interopDefault(import('../pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/index" */))
const _029ab340 = () => interopDefault(import('../pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/create" */))
const _32e7cbf4 = () => interopDefault(import('../pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_id" */))
const _55004ceb = () => interopDefault(import('../pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_namespace/_id" */))
const _4532f092 = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

// TODO: remove in Nuxt 3
const emptyFn = () => {}
const originalPush = Router.prototype.push
Router.prototype.push = function push (location, onComplete = emptyFn, onAbort) {
  return originalPush.call(this, location, onComplete, onAbort)
}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: decodeURI('/'),
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/about",
    component: _84a2a61c,
    name: "about"
  }, {
    path: "/account",
    component: _2e35b556,
    name: "account"
  }, {
    path: "/c",
    component: _4a8f4dcb,
    name: "c"
  }, {
    path: "/clusters",
    component: _e23f7a32,
    name: "clusters"
  }, {
    path: "/design-system",
    component: _1ddd0574,
    name: "design-system"
  }, {
    path: "/fail-whale",
    component: _d2c11bb6,
    name: "fail-whale"
  }, {
    path: "/home",
    component: _49bb45ec,
    name: "home"
  }, {
    path: "/prefs",
    component: _7dc23ad6,
    name: "prefs"
  }, {
    path: "/support",
    component: _6acef877,
    name: "support"
  }, {
    path: "/account/create-key",
    component: _15a7e99b,
    name: "account-create-key"
  }, {
    path: "/auth/login",
    component: _6a2658ad,
    name: "auth-login"
  }, {
    path: "/auth/logout",
    component: _27b5c576,
    name: "auth-logout"
  }, {
    path: "/auth/setup",
    component: _2d80f9c1,
    name: "auth-setup"
  }, {
    path: "/auth/verify",
    component: _07dd28e5,
    name: "auth-verify"
  }, {
    path: "/design-system/form-controls",
    component: _751d38da,
    name: "design-system-form-controls"
  }, {
    path: "/design-system/provider-images",
    component: _bcb0b370,
    name: "design-system-provider-images"
  }, {
    path: "/rio/mesh",
    component: _14e7e8af,
    name: "rio-mesh"
  }, {
    path: "/design-system/page-examples/create",
    component: _9f57cf00,
    name: "design-system-page-examples-create"
  }, {
    path: "/design-system/page-examples/detail",
    component: _20f2dd55,
    name: "design-system-page-examples-detail"
  }, {
    path: "/design-system/page-examples/list",
    component: _08505222,
    name: "design-system-page-examples-list"
  }, {
    path: "/c/:cluster",
    component: _4e2e43d5,
    name: "c-cluster"
  }, {
    path: "/docs/:doc?",
    component: _31430ab2,
    name: "docs-doc"
  }, {
    path: "/c/:cluster/apps",
    component: _34dbd482,
    name: "c-cluster-apps"
  }, {
    path: "/c/:cluster/auth",
    component: _d3444790,
    name: "c-cluster-auth"
  }, {
    path: "/c/:cluster/backup",
    component: _151fdadc,
    name: "c-cluster-backup"
  }, {
    path: "/c/:cluster/cis",
    component: _2d59ff93,
    name: "c-cluster-cis"
  }, {
    path: "/c/:cluster/ecm",
    component: _5ed9fbd5,
    name: "c-cluster-ecm"
  }, {
    path: "/c/:cluster/explorer",
    component: _675ef8e2,
    name: "c-cluster-explorer"
  }, {
    path: "/c/:cluster/fleet",
    component: _d3a37fd8,
    name: "c-cluster-fleet"
  }, {
    path: "/c/:cluster/gatekeeper",
    component: _8222ffe6,
    name: "c-cluster-gatekeeper"
  }, {
    path: "/c/:cluster/harvester",
    component: _5aea4d1c,
    name: "c-cluster-harvester"
  }, {
    path: "/c/:cluster/harvesterManager",
    component: _6a9d4947,
    name: "c-cluster-harvesterManager"
  }, {
    path: "/c/:cluster/istio",
    component: _00cd7b76,
    name: "c-cluster-istio"
  }, {
    path: "/c/:cluster/legacy",
    component: _1475f3d9,
    name: "c-cluster-legacy"
  }, {
    path: "/c/:cluster/logging",
    component: _2dd263b6,
    name: "c-cluster-logging"
  }, {
    path: "/c/:cluster/longhorn",
    component: _2c7dcd62,
    name: "c-cluster-longhorn"
  }, {
    path: "/c/:cluster/manager",
    component: _512288f3,
    name: "c-cluster-manager"
  }, {
    path: "/c/:cluster/mcapps",
    component: _51164b50,
    name: "c-cluster-mcapps"
  }, {
    path: "/c/:cluster/monitoring",
    component: _56132f18,
    name: "c-cluster-monitoring"
  }, {
    path: "/c/:cluster/settings",
    component: _f8494b1a,
    name: "c-cluster-settings"
  }, {
    path: "/c/:cluster/apps/charts",
    component: _4df3a818,
    name: "c-cluster-apps-charts"
  }, {
    path: "/c/:cluster/auth/config",
    component: _0846024f,
    name: "c-cluster-auth-config"
  }, {
    path: "/c/:cluster/auth/roles",
    component: _9830d634,
    name: "c-cluster-auth-roles"
  }, {
    path: "/c/:cluster/explorer/tools",
    component: _0c5a8c9b,
    name: "c-cluster-explorer-tools"
  }, {
    path: "/c/:cluster/gatekeeper/constraints",
    component: _27547a18,
    name: "c-cluster-gatekeeper-constraints"
  }, {
    path: "/c/:cluster/harvester/support",
    component: _4484ee48,
    name: "c-cluster-harvester-support"
  }, {
    path: "/c/:cluster/legacy/project",
    component: _9afe4d3a,
    name: "c-cluster-legacy-project"
  }, {
    path: "/c/:cluster/manager/cloudCredential",
    component: _faa0ade0,
    name: "c-cluster-manager-cloudCredential"
  }, {
    path: "/c/:cluster/monitoring/monitor",
    component: _b9548aba,
    name: "c-cluster-monitoring-monitor"
  }, {
    path: "/c/:cluster/monitoring/route-receiver",
    component: _4a7b11e0,
    name: "c-cluster-monitoring-route-receiver"
  }, {
    path: "/c/:cluster/settings/brand",
    component: _f5dfcab0,
    name: "c-cluster-settings-brand"
  }, {
    path: "/c/:cluster/apps/charts/chart",
    component: _47541db8,
    name: "c-cluster-apps-charts-chart"
  }, {
    path: "/c/:cluster/apps/charts/install",
    component: _0e4e64e1,
    name: "c-cluster-apps-charts-install"
  }, {
    path: "/c/:cluster/auth/group.principal/assign-edit",
    component: _4e66bb7e,
    name: "c-cluster-auth-group.principal-assign-edit"
  }, {
    path: "/c/:cluster/legacy/project/pipelines",
    component: _007d02bc,
    name: "c-cluster-legacy-project-pipelines"
  }, {
    path: "/c/:cluster/manager/cloudCredential/create",
    component: _0a0c78a4,
    name: "c-cluster-manager-cloudCredential-create"
  }, {
    path: "/c/:cluster/monitoring/monitor/create",
    component: _21d4370a,
    name: "c-cluster-monitoring-monitor-create"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/create",
    component: _2c9b74de,
    name: "c-cluster-monitoring-route-receiver-create"
  }, {
    path: "/c/:cluster/explorer/tools/pages/:page?",
    component: _2d0377ec,
    name: "c-cluster-explorer-tools-pages-page"
  }, {
    path: "/c/:cluster/auth/config/:id",
    component: _e2836712,
    name: "c-cluster-auth-config-id"
  }, {
    path: "/c/:cluster/legacy/pages/:page?",
    component: _33100eac,
    name: "c-cluster-legacy-pages-page"
  }, {
    path: "/c/:cluster/legacy/project/:page",
    component: _1b421dff,
    name: "c-cluster-legacy-project-page"
  }, {
    path: "/c/:cluster/manager/cloudCredential/:id",
    component: _6596a110,
    name: "c-cluster-manager-cloudCredential-id"
  }, {
    path: "/c/:cluster/manager/pages/:page?",
    component: _5202d244,
    name: "c-cluster-manager-pages-page"
  }, {
    path: "/c/:cluster/mcapps/pages/:page?",
    component: _0a69c3e9,
    name: "c-cluster-mcapps-pages-page"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/:id?",
    component: _63640c48,
    name: "c-cluster-monitoring-route-receiver-id"
  }, {
    path: "/c/:cluster/auth/roles/:resource/create",
    component: _1893f90c,
    name: "c-cluster-auth-roles-resource-create"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/serial",
    component: _3c53de44,
    name: "c-cluster-harvester-console-uid-serial"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/vnc",
    component: _1a3ec10b,
    name: "c-cluster-harvester-console-uid-vnc"
  }, {
    path: "/c/:cluster/auth/roles/:resource/:id?",
    component: _61a9632c,
    name: "c-cluster-auth-roles-resource-id"
  }, {
    path: "/c/:cluster/monitoring/monitor/:namespace/:id?",
    component: _687d4006,
    name: "c-cluster-monitoring-monitor-namespace-id"
  }, {
    path: "/c/:cluster/navlinks/:group?",
    component: _54b98afc,
    name: "c-cluster-navlinks-group"
  }, {
    path: "/c/:cluster/:product",
    component: _a4987480,
    name: "c-cluster-product"
  }, {
    path: "/c/:cluster/:product/members",
    component: _1c96d24a,
    name: "c-cluster-product-members"
  }, {
    path: "/c/:cluster/:product/namespaces",
    component: _2b660f7a,
    name: "c-cluster-product-namespaces"
  }, {
    path: "/c/:cluster/:product/projectsnamespaces",
    component: _71d9c074,
    name: "c-cluster-product-projectsnamespaces"
  }, {
    path: "/c/:cluster/:product/:resource",
    component: _b852afc4,
    name: "c-cluster-product-resource"
  }, {
    path: "/c/:cluster/:product/:resource/create",
    component: _029ab340,
    name: "c-cluster-product-resource-create"
  }, {
    path: "/c/:cluster/:product/:resource/:id",
    component: _32e7cbf4,
    name: "c-cluster-product-resource-id"
  }, {
    path: "/c/:cluster/:product/:resource/:namespace/:id?",
    component: _55004ceb,
    name: "c-cluster-product-resource-namespace-id"
  }, {
    path: "/",
    component: _4532f092,
    name: "index"
  }],

  fallback: false
}

export function createRouter () {
  return new Router(routerOptions)
}
