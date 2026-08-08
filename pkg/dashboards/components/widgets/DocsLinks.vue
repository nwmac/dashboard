<script>
import CommunityLinks from '@shell/components/CommunityLinks';

export default {
  name: 'DocsLinks',

  widget: {
    title: 'Links',
    description: 'Customizable links',
    icon: require('../assets/Links.png'),
    width: 4,
    height: 5,
    style: {
      border: 0
    }
  },

  components: {
    CommunityLinks,
  },  
};
</script>

<template>
  <CommunityLinks class="links"/>
</template>

<style lang="scss" scoped>
  .links {
    flex-direction: column;
  }
</style>
