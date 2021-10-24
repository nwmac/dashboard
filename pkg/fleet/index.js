// Init the package - this function will be passed the Extension API

export default function(router, store, $extension) {
  console.log('Fleet pkg init'); // eslint-disable-line no-console
  console.log($extension); // eslint-disable-line no-console

  // Register products
  $extension.addProducts([
    import('./product'),
  ]);

  $extension.registerDynamics({ edit: { 'fleet.cattle.io.gitrepo': import('./edit/fleet.cattle.io.gitrepo.vue') } });

  console.log('Loaded Fleet pkg'); // eslint-disable-line no-console
}
