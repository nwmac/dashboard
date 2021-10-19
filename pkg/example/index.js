import Test from './pages/test';

// Init the package - this function will be passed the Extension API

export default function(router, store, $extension) {
  console.log('Epinio pkg init'); // eslint-disable-line no-console
  console.log($extension); // eslint-disable-line no-console

  router.addRoute({
    path:      '/test',
    name:      'test',
    component: Test
  });

  store.commit('nav/addNav', {
    id:    'epinio',
    label: 'Epinio',
    icon:  'icon-gear',
    route: { name: 'test' }
  });

  // $extension.registerModel('a.b.c', () => import(/* webpackChunkName: "models" */ './models/a.b.c'));

  console.log('Loaded Epinio pkg'); // eslint-disable-line no-console
}
