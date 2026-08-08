// import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin, IInternal } from '@shell/core/types';
import Dashboard from './components/Dashboard.vue';
import Dash from './components/Dash.vue';
// import Dashboard from './components/DashboardDemo.vue';

import Square from './components/widgets/Square.vue';
import ClusterList from './components/widgets/ClusterList.vue';
import RancherBanner from './components/widgets/RancherBanner.vue';
import Links from './components/widgets/DocsLinks.vue';
import Clock from './components/widgets/Clock.vue';

// Init the package
export default function(plugin: IPlugin, internal: IInternal): void {
  // Auto-import model, detail, edit from the folders
  // importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.setHomePage(Dashboard);

  // Register widgets
  plugin.register('widget', 'Square', Square);
  plugin.register('widget', 'ClusterList', ClusterList);
  plugin.register('widget', 'RancherBanner', RancherBanner);
  plugin.register('widget', 'Links', Links);
  plugin.register('widget', 'Clock', Clock);

  plugin.addAction(ActionLocation.HEADER, { product: ['home'] },
  {
    label: 'dashboard-toggle-edit',
    icon: 'icon-dashboard',

    invoke() {}
  });
}
