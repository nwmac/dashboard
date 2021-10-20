import Test from './pages/test';

// Init the package - this function will be passed the Extension API

export default async function(router, store, $extension) {
  console.log('Example pkg init'); // eslint-disable-line no-console
  console.log($extension); // eslint-disable-line no-console

  router.addRoute({
    path:      '/test',
    name:      'test',
    component: Test
  });

  store.commit('nav/addNav', {
    id:    'example',
    label: 'Example',
    icon:  'icon-gear',
    route: { name: 'test' }
  });

  // $extension.registerModel('a.b.c', () => import(/* webpackChunkName: "models" */ './models/a.b.c'));

  // Register products
  await $extension.addProducts([
    import('./product'),
  ]);

  // $extension.registerDynamics({
  //   product: {
  //     example: import('./product')
  //   }
  // });

  // const impl = await import('./product')
  // impl.init(store, $extension);

  // applyProducts(store, $extension);

  console.log('Loaded Example pkg'); // eslint-disable-line no-console
}
