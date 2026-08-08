<script>
import SortableTable from '@shell/components/SortableTable';
import { BadgeState } from '@components/BadgeState';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster } from '@shell/utils/cluster';
import { createMemoryFormat, formatSi, parseSi, createMemoryValues } from '@shell/utils/units';
import { STATE } from '@shell/config/table-headers';
import { MANAGEMENT, CAPI } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { MODE, _IMPORT } from '@shell/config/query-params';

export default {
  name: 'ClusterList',

  components: {
    SortableTable,
    BadgeState,
  },  

  widget: {
    width: 8,
    height: 6,
    title: 'Cluster List',
    description: 'Shows a list of clusters with metadata and allow quick exploration into a cluster along with links to Cluster Management functions.',
    icon: require('../assets/ClusterList.png')
  },

  fetch() {
    if ( this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER) ) {
      this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }

    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
      this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }
  },

  computed: {

    provClusters() {
      return this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER);
    },

    // User can go to Cluster Management if they can see the cluster schema
    canManageClusters() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema;
    },

    canCreateCluster() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },

    manageLocation() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
        query: { [MODE]: _IMPORT }
      };
    },    

    clusterHeaders() {
      return [
        STATE,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
          getValue:      (row) => row.mgmt?.nameDisplay
        },
        {
          label:     this.t('landing.clusters.provider'),
          value:     'mgmt.status.provider',
          name:      'Provider',
          sort:      ['mgmt.status.provider'],
          formatter: 'ClusterProvider'
        },
        {
          label: this.t('landing.clusters.kubernetesVersion'),
          value: 'kubernetesVersion',
          name:  'Kubernetes Version'
        },
        {
          label: this.t('tableHeaders.cpu'),
          value: '',
          name:  'cpu',
          sort:  ['status.allocatable.cpu', 'status.available.cpu']

        },
        {
          label: this.t('tableHeaders.memory'),
          value: '',
          name:  'memory',
          sort:  ['status.allocatable.memory', 'status.available.memory']

        },
        {
          label:        this.t('tableHeaders.pods'),
          name:         'pods',
          value:        '',
          sort:         ['status.allocatable.pods', 'status.requested.pods'],
          formatter:    'PodsUsage',
          delayLoading: true
        },
        // {
        //   name:  'explorer',
        //   label:  this.t('landing.clusters.explorer')
        // }
      ];
    },

    kubeClusters() {
      return filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.provClusters || [], this.$store), this.$store);
    }
  },

  methods: {

    cpuUsed(cluster) {
      return parseSi(cluster.status.requested?.cpu);
    },

    cpuAllocatable(cluster) {
      return parseSi(cluster.status.allocatable?.cpu);
    },
    memoryAllocatable(cluster) {
      const parsedAllocatable = (parseSi(cluster.status.allocatable?.memory) || 0).toString();
      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },

    memoryReserved(cluster) {
      const memValues = createMemoryValues(cluster?.status?.allocatable?.memory, cluster?.status?.requested?.memory);

      return `${ memValues.useful }/${ memValues.total } ${ memValues.units }`;
    },    
  }
};
</script>

<template>
  <SortableTable
    :table-actions="false"
    :row-actions="false"
    key-field="id"
    :rows="kubeClusters"
    :headers="clusterHeaders"
    :loading="!kubeClusters"
    class="widget"
  >
    <template #header-left>
      <div class="row table-heading">
        <h2 class="mb-0">
          {{ t('landing.clusters.title') }}
        </h2>
        <BadgeState
          v-if="kubeClusters"
          :label="kubeClusters.length.toString()"
          color="role-tertiary ml-20 mr-20"
        />
      </div>
    </template>
    <template
      v-if="canCreateCluster || canManageClusters"
      #header-middle
    >
      <div class="table-heading">
        <n-link
          v-if="canManageClusters"
          :to="manageLocation"
          class="btn btn-sm role-secondary"
          data-testid="cluster-management-manage-button"
        >
          {{ t('cluster.manageAction') }}
        </n-link>
        <n-link
          v-if="canCreateCluster"
          :to="importLocation"
          class="btn btn-sm role-primary"
          data-testid="cluster-create-import-button"
        >
          {{ t('cluster.importAction') }}
        </n-link>
        <n-link
          v-if="canCreateCluster"
          :to="createLocation"
          class="btn btn-sm role-primary"
          data-testid="cluster-create-button"
        >
          {{ t('generic.create') }}
        </n-link>
      </div>
    </template>
    <template #col:name="{row}">
      <td>
        <div class="list-cluster-name">
          <span v-if="row.mgmt">
            <n-link
              v-if="row.mgmt.isReady && !row.hasError"
              :to="{ name: 'c-cluster-explorer', params: { cluster: row.mgmt.id }}"
            >
              {{ row.nameDisplay }}
            </n-link>
            <span v-else>{{ row.nameDisplay }}</span>
          </span>
          <i
            v-if="row.unavailableMachines"
            v-clean-tooltip="row.unavailableMachines"
            class="conditions-alert-icon icon-alert icon"
          />
        </div>
      </td>
    </template>
    <template #col:cpu="{row}">
      <td v-if="row.mgmt && cpuAllocatable(row.mgmt)">
        {{ `${cpuAllocatable(row.mgmt)} ${t('landing.clusters.cores', {count:cpuAllocatable(row.mgmt) })}` }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>
    <template #col:memory="{row}">
      <td v-if="row.mgmt && memoryAllocatable(row.mgmt) && !memoryAllocatable(row.mgmt).match(/^0 [a-zA-z]/)">
        {{ memoryAllocatable(row.mgmt) }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>
    <!-- <template #cell:explorer="{row}">
      <n-link v-if="row && row.isReady" class="btn btn-sm role-primary" :to="{name: 'c-cluster', params: {cluster: row.id}}">
        {{ t('landing.clusters.explore') }}
      </n-link>
      <button v-else :disabled="true" class="btn btn-sm role-primary">
        {{ t('landing.clusters.explore') }}
      </button>
    </template> -->
  </SortableTable>
</template>

<style lang="scss" scoped>
  .widget {
    padding: 10px;
  }
</style>
