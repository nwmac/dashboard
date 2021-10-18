<script>
import FleetRepos from '@shell/components/FleetRepos';
import Loading from '@shell/components/Loading';
import { FLEET } from '@shell/config/types';

export default {
  name:       'ListGitRepo',
  components: { Loading, FleetRepos },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    resource: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    const store = this.$store;

    await store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });

    const inStore = store.getters['currentStore'](this.resource);

    this.rows = await store.dispatch(`${ inStore }/findAll`, { type: this.resource });
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <FleetRepos
    v-else
    :rows="rows"
    :schema="schema"
  />
</template>
