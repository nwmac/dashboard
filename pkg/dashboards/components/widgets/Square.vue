<script>
export default {
  name: 'Square',

  widget: {
    title: 'Example Widget',
    description: 'Super simple example widget',
    icon: require('../assets/Square.png'),
    props: [
      {
        name: 'text',
        label: 'Text to display',
        type: 'string',
        default: 'Example Widget'
      },
      {
        name: 'color',
        label: 'Background color',
        type: 'color',
        default: '#c4c4c4'
      }
    ]
  },

  props: {
    text: {
      type: String,
      default: 'Example Widget'
    },
    color: {
      type: String,
      default: '#c4c4c4'
    }
  },

  computed: {
    style() {
      return { 'background-color': this.color };
    }
  }
};
</script>

<template>
  <div class="square" :style="style">
    <h1>{{ text }}</h1>
  </div>
</template>

<style lang="scss" scoped>
  .square {
    display: flex;
    background-color: #ddf1dd;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
</style>
