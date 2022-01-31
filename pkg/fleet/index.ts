import { importTypes } from '@ranch/auto-import';
import { IPlugin } from '@shell/core/types';

// Init the package
export default function($plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);

  $plugin.metadata = require('./package.json');

  $plugin.addProduct(require('./fleet'));

  $plugin.addLocale('en-uk', 'English (UK)');
}
