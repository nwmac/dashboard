<script>
import { Banner } from '@components/Banner';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';

export default {

  components: {
    Banner,
    RadioGroup,
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return {
      ingress: 'none'
    };
  },

  computed: {
    options() {
      return [
        { label: 'None', value: 'none' },
        { label: 'Traefik', value: 'traefik' },
        { label: 'NGINX Ingress', value: 'nginx' },
        { label: 'Traefik and NGINX Ingress', value: 'both' },
      ];
    }
  }
};
</script>

<template>
  <div>
    <RadioGroup 
      :mode="mode"
      :options="options"
      v-model:value="ingress"
    ></RadioGroup>

    <div v-if="ingress === 'nginx'" class="option">
      <h3>NGINX Ingress</h3>
      <Banner color="error"
      >
        The NGINX Ingress controller installed in this cluster is no longer maintained. We recommend migrating to the Traefik Ingress Controller or setting to "None" to uninstall, if not required.
      </Banner>
      <div>We could allow NGINX config to be modified here</div>
    </div>
    <div v-else-if="ingress === 'traefik'" class="option">
      <h3>Traefik Ingress Controller</h3>
      <Banner color="info">
        Rancher will deploy Traefik with default options. You can modify common options below, or use the YAML editor for advanced configuration
      </Banner>
      <div>
        Insert Options and ability to switch to YAML here
      </div>
    </div>
    <div v-else-if="ingress === 'both'" class="option">
      <h3>Traefik Ingress Controller and NGINX Ingress</h3>
      <Banner color="warning"
      >
        Installing both Ingress Controllers is only recommended to support migration from NGINX Ingress to Traefik
      </Banner>
      <div>Please ensure you are familiar with the migration steps required when moving from NGINX to Traefik. Traefik
        provides a compatibility mode to support existing Ingress resources, but there are some limitations to be aware of. Some workloads
        may need to be updated to retain the appropriate Ingress capabilities with Traefik. Please refer to the documentation for more details.
      </div>
      <Banner color="info">
        Rancher will deploy Traefik with default options. In order to avoid conflict with NGINX ingress, Traefik will be configured to use a different port for HTTP (8080) and HTTPS (8443) traffic. You can modify common options below, or use the YAML editor for advanced configuration.
      </Banner>
      <div>
        NGINX Ingress compatibility will be enabled for Traefik and the ingress class for this will be set to <b>rke2-ingress-nginx-migration</b>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .option {
    margin-top: 20px;

    > div {
      margin-bottom: 10px;
    }
  }
</style>