<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FleetSummary from '@shell/components/FleetSummary';
import FleetResources from '@shell/components/FleetResources';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET } from '@shell/config/types';

export default {
  name: 'DetailGitRepo',

  components: {
    FleetResources,
    FleetSummary,
    ResourceTabs,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  },
};
</script>

<template>
  <div class="mt-20">
    <FleetSummary :value="value.status.resourceCounts" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
