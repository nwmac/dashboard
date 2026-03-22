<script>
import Brand from '@shell/mixins/brand';

export default {
  mixins: [Brand],
  beforeMount() {

    console.error('494: This page could not be found');

    console.error(this.$router.currentRoute);
    console.error(this.$route);

    this.$store.commit('setError', { error: new Error('404: This page could not be found') });
    // this.$router.replace('/fail-whale');

    // this.$router.replace({ name:   'fail-whale' });
  }
};
</script>

<template>
  <div class="dashboard-root" />
</template>
