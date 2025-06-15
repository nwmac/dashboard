<script>
export default {
  data() {
    return {};
  },
  methods: {
    coverageTestFunction(argA, numberA, numberB) {
      console.log('coverageTestFunction');

      let result = 0;

      if (argA) {
        result += 10;
      } else {
        result += 100;
      }

      result += numberA > 50 ? 1000 : 0;

      result += numberB || 0;

      return result;
    }
  }
};
</script>

<template>
  <div class="ignored">
    Coverage Test Panel
  </div>
</template>

<style lang="scss" scoped>
  .ignored {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: -1000;
    pointer-events: none;
    opacity: 0;
  }
</style>
