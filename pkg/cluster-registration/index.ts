import { importTypes } from '@rancher/auto-import';

import { IPlugin, IProducts } from '@shell/core/types';
import { routes as clusterProdRoutes, clusterProdName } from './config/cluster-prod-routes-config';
import Page4 from './pages/page4.vue';

// Init the package
export default function(plugin: IPlugin) {
  // console.log('=== singleProdName ===', singleProdName);
  // console.log('=== clusterProdName ===', clusterProdName);
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.initProducts((products: IProducts) => {
    // Add navigation to an existing product
    const explorer = products.get('explorer');

    if (explorer) {
      explorer.addRoutes([
        {
          name: 'page1',
          path: 'page1',
          component: Page4
        }
      ]);

      // TODO: Weights etc
      // This would add a resource type to the navigation
      // explorer.addNavigation('catalog.cattle.io.uiplugin', 'testgroup');

      explorer.addNavigation([
        {
          name: 'page1',
          route: 'page1'
        },
        'catalog.cattle.io.uiplugin'
      ], 'testgroup');

      // TODO: Need to add support for custom labels/label keys on groups
      // explorer.addNavigationGroup('testgroup', {
      //   label: 'Custom Group',
      //   weight: 100
      // });
    }    
  });
}
