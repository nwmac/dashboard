import Plugins from './pages/Plugins';

// Init the package - this function will be passed the Extension API

export default function(router, store, $extension) {
  router.addRoute({
    path:      '/plugins',
    name:      'plugins',
    component: Plugins
  });

  store.commit('nav/addNav', {
    id:       'plugins',
    label:    'Plugins',
    icon:     'icon-gear',
    category: 'configuration',
    route:    { name: 'plugins' }
  });
}
