<script>
import Loading from '@/components/Loading';

export default {
  components: {
    Loading,
  },

  data() {
    return {
      iframeEl: null,
      loaded: false,
      src: null,
    }
  },

  mounted() {
    console.log('mounted');
    this.src = '/embed/cluster-manager';

    const iframe = document.createElement('iframe');
    console.log(iframe);
    //this.iframeEl.setAttribute('style', 'visibility: hidden; position: absolute; top: -99999px; border: none;');    
    iframe.setAttribute('src', '/embed/cluster-manager');

    //this.$el.appendChild(iframe);
  },

  methods: {
    frameLoaded() {
      if (this.src) {
        console.log('iframe has been loaded');
        this.loaded = true;
      }
    }
  }
};
</script>

<template>
  <div>
    <Loading :loading="!loaded" />
    <iframe
      :src="src"
      @load="frameLoaded"
      frameborder="0"
      :class="{ 'loading': loaded }"
      class="frame"></iframe>
  </div>
</template>

<style lang="scss" scoped>

  .frame {
    flex: 1;
    visibility: hidden;
    margin: -20px;
  }

  .loading {
    visibility: visible;
  }
</style>
