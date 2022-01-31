
import { FLEET } from '@shell/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@shell/config/table-headers';
import { FLEET as FLEET_FEATURE } from '@shell/store/features';

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function init($plugin, store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    headers,
  } = $plugin.DSL(store, NAME);

  product({
    ifHaveType:            FLEET.GIT_REPO,
    ifFeature:             FLEET_FEATURE,
    icon:                  'fleet',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
    showWorkspaceSwitcher: true,
  });

  /*
  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'istio-overview',
    weight:      100,
    route:       { name: 'c-cluster-istio' },
    exact:       true,
  });
*/

  // basicType('istio-overview');

  basicType([
    FLEET.CLUSTER,
    FLEET.CLUSTER_GROUP,
    FLEET.GIT_REPO,
  ]);

  configureType(FLEET.CLUSTER, { isCreatable: false });

  weightType(FLEET.GIT_REPO, 109, true);
  weightType(FLEET.CLUSTER, 108, true);
  weightType(FLEET.CLUSTER_GROUP, 107, true);

  basicType([
    FLEET.WORKSPACE,
    FLEET.BUNDLE,
    FLEET.TOKEN,
  ], 'Advanced');

  headers(FLEET.WORKSPACE, [
    STATE,
    NAME_COL,
    {
      name:      'gitRepos',
      labelKey:  'tableHeaders.gitRepos',
      value:     'counts.gitRepos',
      sort:      'counts.gitRepos',
      formatter: 'Number',
    },
    {
      name:      'clusters',
      labelKey:  'tableHeaders.clusters',
      value:     'counts.clusters',
      sort:      'counts.clusters',
      formatter: 'Number',
    },
    {
      name:      'clusterGroups',
      labelKey:  'tableHeaders.clusterGroups',
      value:     'counts.clusterGroups',
      sort:      'counts.clusterGroups',
      formatter: 'Number',
    },
    AGE
  ]);
}
