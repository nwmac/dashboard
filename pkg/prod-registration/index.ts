import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { routes as singleProdRoutes, singleProdName } from './config/single-prod-routes-config';

// Init the package
export default function(plugin: IPlugin) {
  // console.log('=== singleProdName ===', singleProdName);
  // console.log('=== clusterProdName ===', clusterProdName);
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/single-prod-reg-config'), singleProdName);

  // Add Vue Routes
  plugin.addRoutes(singleProdRoutes);
}
