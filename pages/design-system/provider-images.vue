<script>
import { mapPref, THEME } from '@/store/prefs';
import { ucFirst } from '@/utils/string';

const PROVIDERS = [
  'aliyunecs',
  'amazonec2',
  'amazoneks',
  'azureaks',
  'digitalocean',
  'equinix',
  'googlegke',
  'k3s',
  'kubernetes',
  'linodelke',
  'minikube',
  'open-telekom-cloud',
  'oracleoke',
  'packet',
  'rackspace',
  'tencenttke',
  'vmwarevsphere',
];

export default {
  layout: 'unauthenticated',

  data() {
    return {
      providers:     PROVIDERS.map(p => require(`~/assets/images/providers/provider-${ p }.svg`)),
      providersMono: PROVIDERS.map(p => require(`~/assets/images/providers/provider-${ p }-black.svg`)),
    };
  },

  computed: {
    theme: mapPref(THEME),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          label: ucFirst(value),
          value
        };
      });
    },
  }
};
</script>
<template>
  <div class="grid">
    <!--these images are 100px X 100px svgs setting the image to fit the frame-->
    <h2>Full Color Logos</h2>
    <div class="row">
      <div v-for="p in providers" :key="p" class="col">
        <img class="" :src="p" />
      </div>
    </div>

    <!--black logos-->
    <h2>Single Color Logos</h2>
    <div class="row">
      <div v-for="p in providersMono" :key="p" class="col">
        <img class="" :src="p" />
      </div>
    </div>

    <div class="reverse-filter">
      <h2>Inverted with CSS - Single Color Logos</h2>

      <div class="row">
        <div v-for="p in providersMono" :key="p" class="col">
          <img class="" :src="p" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.grid {
  margin: 10px;
}
.row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  margin: .75% auto;
}

.col {
  border: solid 1px #d7d7d7;
  margin: 0;
  padding: .75%;
  width: 100px;
}

.reverse-filter {
  background: black;

  h2 {
    color: #fff;
  }

  .row {
    border-color: #3d3d3d;
  }

  .col {
    border-color: #3d3d3d;
  }

  .col img {
    filter: invert(100%);
  }
}
</style>
