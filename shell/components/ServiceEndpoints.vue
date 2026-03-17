<script>
import { RcButton } from '@components/RcButton';
import { isMaybeSecure } from '@shell/utils/url';

export default {
  name: 'ServiceEndpoints',

  components: { RcButton },

  props: {
    /**
     * Array of service resources to extract endpoints from
     */
    services: {
      type:    Array,
      default: () => [],
    },

    /**
     * Optional title override. Set to empty string to hide the header.
     */
    title: {
      type:    String,
      default: null,
    },

    /**
     * Whether to show the component container styling
     */
    showContainer: {
      type:    Boolean,
      default: true,
    },
  },

  computed: {
    /**
     * Extract service endpoints that have clickable ports (80, 443, etc.)
     */
    endpoints() {
      const endpoints = [];

      for (const service of this.services) {
        const ports = service.spec?.ports || [];
        const serviceName = service.metadata?.name;
        const namespace = service.metadata?.namespace;

        for (const port of ports) {
          const portNum = port.port;
          const protocol = port.protocol || 'TCP';
          const stringPort = portNum?.toString();

          // Only show endpoints for HTTP/HTTPS ports
          if (protocol === 'TCP' && stringPort && (stringPort.endsWith('80') || stringPort.endsWith('443'))) {
            const scheme = isMaybeSecure(portNum, protocol) ? 'https' : 'http';
            const proxyUrl = service.proxyUrl?.(scheme, portNum);

            if (proxyUrl) {
              endpoints.push({
                serviceName,
                namespace,
                port:       portNum,
                portName:   port.name,
                scheme,
                url:        proxyUrl,
                targetPort: port.targetPort,
              });
            }
          }
        }
      }

      return endpoints;
    },

    hasEndpoints() {
      return this.endpoints.length > 0;
    },

    displayTitle() {
      if (this.title !== null) {
        return this.title;
      }

      return this.t('serviceEndpoints.title');
    },
  },

  methods: {
    openEndpoint(url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  },
};
</script>

<template>
  <div
    v-if="hasEndpoints"
    class="service-endpoints"
    :class="{ 'with-container': showContainer }"
  >
    <h3
      v-if="displayTitle"
      class="mb-10"
    >
      {{ displayTitle }}
    </h3>
    <div class="endpoints-list">
      <RcButton
        v-for="endpoint in endpoints"
        :key="`${endpoint.serviceName}-${endpoint.port}`"
        secondary
        class="endpoint-btn"
        @click="openEndpoint(endpoint.url)"
      >
        <template #before>
          <i class="icon icon-external-link" />
        </template>
        <span class="service-name">{{ endpoint.serviceName }}</span>
        <span
          v-if="endpoint.portName"
          class="port-name"
        >({{ endpoint.portName }})</span>
        <span class="port-info">
          :{{ endpoint.port }}
          <span
            v-if="endpoint.targetPort"
            class="target-port"
          >
            <i class="icon icon-endpoints_connected" />
            {{ endpoint.targetPort }}
          </span>
        </span>
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.service-endpoints {
  &.with-container {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 15px;
    background-color: var(--body-bg);
  }

  h3 {
    margin: 0 0 5px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .endpoints-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .endpoint-btn {
    .service-name {
      font-weight: 500;
    }

    .port-name {
      margin-left: 4px;
      opacity: 0.8;
    }

    .port-info {
      margin-left: 4px;
      font-family: monospace;
      font-size: 12px;
      opacity: 0.8;
    }

    .target-port {
      margin-left: 4px;

      .icon {
        font-size: 12px;
      }
    }
  }
}
</style>
