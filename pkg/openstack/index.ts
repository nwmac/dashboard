import { importTypes } from "@rancher/auto-import";
import { IPlugin } from "core/types";

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  //plugin.register('i18n', 'en-us', () => import('./i18n/en-us.yaml'));

  // Register cloud-credential component
  plugin.register('cloud-credential', 'openstack', () => import('./src/cloud-credential.vue'));
  //plugin.register('cloud-credential', 'openstack', false);

  plugin.register('machine-config', 'openstack', () => import('./src/machine-config.vue'));
  // plugin.register('machine-config', 'openstack', () => import('./src/generic.vue'));

  console.error('Registered Openstack extension');
}
