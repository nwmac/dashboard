<script>
import YamlEditor from '@shell/components/YamlEditor';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';
import Tab from '@shell/components/Tabbed/Tab';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import RelatedResources from '@shell/components/RelatedResources';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { CATALOG, SERVICE } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { mergeWithReplace } from '@shell/utils/object';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { isMaybeSecure } from '@shell/utils/url';

export default {
  name: 'DetailRelease',

  components: {
    Markdown, ResourceTabs, Tab, Loading, YamlEditor, Banner, RelatedResources, RcButton
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      allOperations:     [],
      deployedServices:  [],
    };
  },

  async fetch() {
    const promises = {
      catalog:       this.$store.dispatch('catalog/load'),
      allOperations: this.$store.dispatch('cluster/findAll', { type: CATALOG.OPERATION }),
      secret:        this.value.fetchValues(true),
    };

    const res = await allHash(promises);

    this.allOperations = res.allOperations;

    // Fetch deployed services from helm resources
    await this.fetchDeployedServices();
  },

  computed: {
    hasNotes() {
      return !!this.value?.spec?.info?.notes;
    },

    hasReadme() {
      return !!this.value?.spec?.info?.readme;
    },

    valuesYaml() {
      const combined = mergeWithReplace(
        merge({}, this.value?.chartValues || {}),
        this.value?.values || {},
      );

      return jsyaml.dump(combined);
    },

    isBusy() {
      if (this.value?.metadata?.state?.transitioning && this.value?.metadata?.state?.name === 'pending-install') {
        return true;
      }

      return false;
    },

    filteredOperations() {
      return this.allOperations.filter((operation) => {
        if (operation.status?.releaseName === this.value.metadata.name &&
            operation.status?.namespace === this.value.metadata.namespace) {
          return true;
        }
      });
    },

    latestOperation() {
      if (this.filteredOperations.length > 0) {
        const sortedOperations = sortBy(Object.values(this.filteredOperations), ['createdAt', 'created', 'metadata.creationTimestamp'], true);

        return sortedOperations[0];
      }

      return false;
    },

    /**
     * Extract service endpoints that have clickable ports (80, 443, etc.)
     */
    serviceEndpoints() {
      const endpoints = [];

      for (const service of this.deployedServices) {
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
                port:      portNum,
                portName:  port.name,
                scheme,
                url:       proxyUrl,
                targetPort: port.targetPort,
              });
            }
          }
        }
      }

      return endpoints;
    },

    hasServiceEndpoints() {
      return this.serviceEndpoints.length > 0;
    },

  },

  methods: {
    tabChanged({ tab }) {
      window.scrollTop = 0;

      this.selectedTabName = tab.name;

      if ( tab.name === 'values-yaml' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },

    async fetchDeployedServices() {
      const inStore = this.$store.getters['currentStore']();
      const deployedResources = this.value.deployedResources || [];
      const serviceResources = deployedResources.filter((r) => r.toType === SERVICE);

      const services = [];

      for (const resource of serviceResources) {
        try {
          const service = await this.$store.dispatch(`${ inStore }/find`, {
            type: SERVICE,
            id:   resource.toId
          });

          if (service) {
            services.push(service);
          }
        } catch (e) {
          // Service may not exist or user may not have permission
          console.debug(`Could not fetch service ${ resource.toId }:`, e); // eslint-disable-line no-console
        }
      }

      this.deployedServices = services;
    },

    openEndpoint(url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  },

  watch: {
    'value.secretId'(neu, old) {
      this.value.fetchValues(true);
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <span
      v-if="latestOperation"
      class="latest-operation"
    >
      {{ t('catalog.app.section.lastOperation') }}: ( {{ latestOperation.status.action }} ) - <a @click="latestOperation.openLogs()">  {{ t('catalog.app.section.openLogs') }}</a>
    </span>

    <!-- Service Endpoints Section -->
    <div
      v-if="hasServiceEndpoints"
      class="service-endpoints mt-10 mb-10"
    >
      <h3 class="mb-10">{{ t('catalog.app.section.serviceEndpoints.label') }}</h3>
      <div class="endpoints-list">
        <RcButton
          v-for="endpoint in serviceEndpoints"
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

    <ResourceTabs
      class="mt-20"
      default-tab="resources"
      :needConditions="false"
      :needEvents="false"
      :needRelated="false"
      @changed="tabChanged($event)"
    >
      <Tab
        name="resources"
        :label="t('catalog.app.section.resources.label')"
        :weight="4"
      >
        <Banner
          v-if="isBusy"
          color="info"
          :label="t('catalog.app.section.resources.busy', { app: value.metadata.name })"
        />
        <RelatedResources
          v-else
          :value="value"
          rel="helmresource"
        />
      </Tab>
      <Tab
        name="values-yaml"
        :label="t('catalog.app.section.values')"
        :weight="3"
      >
        <YamlEditor
          ref="yaml"
          :scrolling="false"
          :value="valuesYaml"
          editor-mode="VIEW_CODE"
        />
      </Tab>
      <Tab
        v-if="hasReadme"
        name="readme"
        :label="t('catalog.app.section.readme')"
        :weight="2"
      >
        <Markdown v-model:value="value.spec.info.readme" />
      </Tab>
      <Tab
        v-if="hasNotes"
        name="notes"
        :label="t('catalog.app.section.notes')"
        :weight="1"
      >
        <Markdown v-model:value="value.spec.info.notes" />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.latest-operation a {
  cursor: pointer;
}

.service-endpoints {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 15px;
  background-color: var(--body-bg);

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
