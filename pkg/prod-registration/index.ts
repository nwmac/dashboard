import { importTypes } from '@rancher/auto-import';
import { IPlugin, IProducts, IProduct } from '@shell/core/types';
import { routes as singleProdRoutes, singleProdName } from './config/single-prod-routes-config';

import Page1 from './pages/page1.vue';

// Init the package
export default function(plugin: IPlugin) {
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register function that will register product and type information
  plugin.initProducts((products: IProducts) => {
    console.error('Product registration');
    console.log(products);

    // const product = products.add('my-product', {
    //   isMultiClusterApp:     true,
    //   icon:                  'epinio',
    //   removable:             false,
    //   showClusterSwitcher:   false,
    //   showNamespaceFilter:   true,
    //   customNamespaceFilter: true,
    // });

    // Simple call to add a new product that shows up in the side nav
    const simpleProduct = products.add('neil');

    console.log(simpleProduct);

    const advancedProduct = products.add('advanced');

    console.log(advancedProduct);

    advancedProduct.addRoutes([
      {
        name: 'page1',
        path: 'page1',
        component: Page1
      }
    ]);

    // Adds a nav item that goes to the list page for the specified resource
    // advancedProduct.addNavigation('provisioning.cattle.io.cluster');

    // Adds a navigation item to the specified group
    // Creates the group if it does not already exist
    // advancedProduct.addNavigation('catalog.cattle.io.uiplugin', 'advanced');

    // Adds a nav item that goes to the route specified
    advancedProduct.addNavigation({
      name: 'page1',
      route: 'page1'
    });

    // Add Vue routes to the product
    // p.addRoutes({});
  });

  // Add Vue Routes
  // plugin.addRoutes(singleProdRoutes);
}
