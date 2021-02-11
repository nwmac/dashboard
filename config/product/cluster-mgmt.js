import { DSL } from '@/store/type-map';

export const NAME = 'cluster-mgmt';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
    headers,
    hideBulkActions,
  } = DSL(store, NAME);

  product({
    inStore:             'management',
    icon:                'globe',
    weight:              -10,
    removable:           false,
    showClusterSwitcher: false,
  });

  virtualType({
    label:          'Clusters',
    name:           'cluster-mgmt',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          {
      name:   'cluster-mgmt',
    }
  });

  basicType([
    'cluster-mgmt',
  ]);

}
