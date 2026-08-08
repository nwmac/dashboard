<script>
import BannerGraphic from '@shell/components/BannerGraphic';

import { getVendor } from '@shell/config/private-label';

export default {
  name: 'RancherBanner',

  widget: {
    width: 12,
    height: 3,
    noResize: true,
    style: {
      overflow: 'hidden',
      border: 0
    },
    title: 'Rancher Banner',
    description: 'Displays the Rancher welcome banner graphic.',
    icon: require('../assets/RancherBanner.png')
  },

  components: {
    BannerGraphic,
  },

  data() {
    return {
      vendor: getVendor(),
    };
  },  
};
</script>

<template>
  <BannerGraphic
    :small="true"
    :title="t('landing.welcomeToRancher', {vendor})"
    data-testid="home-banner-graphic"
    class="banner"
  />
</template>

<style lang="scss" scoped>
</style>
