<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Tag from '@/components/Tag';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE
} from '@/config/table-headers';
import metricPoller from '@/mixins/metric-poller';

import {
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@/config/types';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
import { GROUP_RESOURCES, mapPref } from '@/store/prefs';
import { COLUMN_BREAKPOINTS } from '@/components/SortableTable/index.vue';

export default {
  name:       'ListNode',
  components: {
    Loading, ResourceTable, Tag
  },
  mixins: [metricPoller],

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = { kubeNodes: this.$store.dispatch('cluster/findAll', { type: NODE }) };

    const canViewMgmtNodes = this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE);
    const canViewNormanNodes = this.$store.getters[`rancher/schemaFor`](NORMAN.NODE);

    this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD);

    if (canViewNormanNodes) {
      // Required for Drain/Cordon action
      hash.normanNodes = this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
    }

    if (canViewMgmtNodes) {
      hash.mgmtNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    if (this.canViewPods) {
      // Used for running pods metrics
      hash.pods = this.$store.dispatch('cluster/findAll', { type: POD });
    }

    const res = await allHash(hash);

    this.kubeNodes = res.kubeNodes;
  },

  data() {
    return {
      kubeNodes:     null,
      canViewPods: false,
    };
  },

  computed: {
    tableGroup: mapPref(GROUP_RESOURCES),

    headers() {
      const headers = [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, {
        ...CPU,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP
      }, {
        ...RAM,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP
      }];

      if (this.canViewPods) {
        headers.push({
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP
        });
      }
      headers.push(AGE);

      return headers;
    },

  },

  methods:  {
    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    },

    get,

  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="kubeNodes"
    :sub-rows="true"
    v-on="$listeners"
  >
    <template #sub-row="{fullColspan, row}">
      <tr class="taints sub-row" :class="{'empty-taints': !row.spec.taints || !row.spec.taints.length}">
        <template v-if="row.spec.taints && row.spec.taints.length">
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td :colspan="fullColspan-2">
            {{ t('node.list.nodeTaint') }}:
            <Tag v-for="taint in row.spec.taints" :key="taint.key + taint.value + taint.effect" class="mr-5">
              {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
            </Tag>
          </td>
        </template>
        <td v-else :colspan="fullColspan">
&nbsp;
        </td>
      </tr>
    </template>
  </ResourceTable>
</template>

<style lang='scss' scoped>
.taints {
  td {
    padding-top:0;
    .tag {
      margin-right: 5px
    }
  }
  &.empty-taints {
    // No taints... so hide sub-row (but not bottom-border)
    height: 0;
    line-height: 0;
    td {
      padding: 0;
    }
  }
}

</style>
