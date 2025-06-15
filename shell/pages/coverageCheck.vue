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
</template>
