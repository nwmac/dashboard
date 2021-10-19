<script>
export default {
  layout: 'plain',

  mounted() {
    console.log('Example pkg test page'); // eslint-disable-line no-console

    // const ext = this.$extension.getModel('a.b.c');
    // const m = await ext();
    // const model = new m.default;
    // console.log(model.message);
  }
};
</script>

<template>
  <div>
    <h1>Example Plugin Page</h1>
  </div>
</template>
