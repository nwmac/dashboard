<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { MANAGEMENT } from '@shell/config/types';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';

export default {
  name:       'ListMgmtClusters',
  components: { Loading, ResourceTable },

  async fetch() {
    await this.$store.dispatch(`management/findAll`, { type: this.$attrs.resource });
  },

  computed: {
    rows() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);

      return filterOnlyKubernetesClusters(all);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" />
</template>
