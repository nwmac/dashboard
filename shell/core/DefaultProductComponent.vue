<script>
export default {
  name: 'DefaultProductLayout',
  layout: 'default',
  // layout: 'plain',

  data() {
    const product = this.$route.params?.product || 'Unknown';

    return { product, top: false };
  },

  middleware({ redirect, route, store } ) {

    console.log('******************************************************************************');
    console.log('DefaultProductComponent');

    console.log(route);

    // return redirect({
    //   name: 'product-page1',
    //   params: {
    //     product: 'advanced',
    //     cluster: '_'
    //   }
    // })
  }

  // middleware({ redirect, route, store } ) {
  //   console.error('middleware');
  //   console.log(route);

  //   if (route.params?.product) {
  //     store.commit('setProduct', route.params.product);
  //   }

  //   if (route.meta) {
  //     const m = Array.isArray(route.meta) ? route.meta[0] : route.meta;

  //     if (m.redirect) {

  //       const name = m.redirect.name;
  //       m.redirect.params = m.redirect.params || {};
  //       m.redirect.params.cluster = '_';
  //       //m.redirect.params.product = route.params.product;

  //       console.log(route.params.product);

  //       if (name !== route.name) {
  //         console.log('REDIRECT!!!! *****************************************');
  //         console.log(m.redirect);
  //         return redirect(m.redirect);
  //       }
  //     }
  //   }
  // }
};
</script>

<template>
  <div>
    <div v-if="top" class="default-page">
      <i class="icon icon-extension" />
      <h1>Default Landing page for product <b>{{ product }}</b></h1>
    </div>
    <div v-else>
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .default-page {
    display: flex;
    align-items: center;

    > .icon {
      padding-top: 100px;
      font-size: 64px;
      padding-bottom: 20px;
      opacity: 0.7;
    }
  }
</style>