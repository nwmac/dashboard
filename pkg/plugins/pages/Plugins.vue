<script>
export default {
  components: {},
  layout:     'plain',
  methods:    {
    loadPackage(name) {
      const moduleUrl = `/pkg/${ name }/${ name }.umd.min.js`;

      console.log(`Load: ${ name }`); // eslint-disable-line no-console

      this.$extension.load(name, moduleUrl);
    }
  }
};
</script>

<template>
  <div class="plugins">
    <div>Plugins</div>
    <br />
    <button class="btn role-primary" @click="loadPackage('example')">
      Load example plugin
    </button>
    <br />
  </div>
</template>

<style lang="scss" scoped>
  .plugins {
    display: inherit;
  }
</style>
