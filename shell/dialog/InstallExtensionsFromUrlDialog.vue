<script setup lang="ts">
/**
 * Installs extensions using the install information found at a URL (dropped onto the Extensions page).
 *
 * Step 1 - Add the repositories listed in the install information (skipped if they have all been added already)
 * Step 2 - Choose the extensions to install (or upgrade) to their latest versions
 */
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import AsyncButton from '@shell/components/AsyncButton';
import { Checkbox } from '@components/Form/Checkbox';
import Banner from '@components/Banner/Banner.vue';
import { RcHeading } from '@components/RcHeading';
import { RcIcon } from '@components/RcIcon';
import { useI18n } from '@shell/composables/useI18n';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SETTING } from '@shell/config/settings';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { getPluginChartVersionLabel } from '@shell/utils/uiplugins';
import { wait } from '@shell/utils/async';
import {
  ExtensionPlan,
  InstalledApp,
  InstallSpec,
  InstallSpecError,
  RepoPlan,
  getFetchUrls,
  parseInstallSpec,
  planExtensions,
  planRepositories,
  toInstalledApp,
} from '@shell/utils/uiplugins-install-from-url';

type Step = 'loading' | 'error' | 'repos' | 'syncing' | 'extensions';
type RepoStatus = 'pending' | 'ready' | 'error';

// How long to wait for a repository to be ready
const REPO_READY_TIMEOUT = 5 * 60 * 1000;
const REPO_READY_INTERVAL = 2000;

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  /**
   * The URL to fetch the install information from
   */
  url: string;
  /**
   * Returns the extensions, as shown on the Extensions page
   */
  getPlugins:() => any[];
  /**
   * Icon to show for extensions that don't have one
   */
  defaultIcon?: string;
  /**
   * Callback to update install status on extensions main screen
   */
  updateStatus?: (id: string, status: string | boolean) => void;
  /**
   * Called with the extensions that are being installed when the dialog closes
   */
  closed?: (installing: ExtensionPlan[]) => void;
}>(), {
  defaultIcon:  undefined,
  updateStatus: () => {},
  closed:       () => {},
});

const emit = defineEmits(['close']);

const store = useStore();
const { t } = useI18n(store);

const step = ref<Step>('loading');
const errors = ref<string[]>([]);
const spec = ref<InstallSpec>();
const repoPlans = ref<RepoPlan[]>([]);
const repoStatus = ref<Record<string, RepoStatus>>({});
const selected = ref<Record<string, boolean>>({});
const installedApps = ref<InstalledApp[]>([]);
const busy = ref(false);

const reposToAdd = computed(() => repoPlans.value.filter((r) => !r.exists));
const existingRepos = computed(() => repoPlans.value.filter((r) => r.exists));

// Re-computed as the charts for the repositories load
const extensionPlans = computed<ExtensionPlan[]>(() => {
  if (!spec.value || step.value !== 'extensions') {
    return [];
  }

  return planExtensions(spec.value.extensions, repoPlans.value, props.getPlugins() || [], installedApps.value);
});

const selectedPlans = computed(() => extensionPlans.value.filter((p) => p.action !== 'none' && selected.value[p.name]));

const errorMessage = (e: any) => e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));

function versionLabel(version: any) {
  return version?.appVersion ? getPluginChartVersionLabel(version) : version?.version;
}

function extensionDescription(plan: ExtensionPlan) {
  switch (plan.action) {
  case 'install':
    return t('plugins.installFromUrl.extensions.version', { version: versionLabel(plan.version) });
  case 'upgrade':
    return t('plugins.installFromUrl.extensions.upgrade', { from: plan.installedVersion, to: versionLabel(plan.version) });
  default:
    // i18n-uses plugins.installFromUrl.extensions.reason.*
    return t(`plugins.installFromUrl.extensions.reason.${ plan.reason }`, { version: plan.installedVersion });
  }
}

function close(installing: ExtensionPlan[] = []) {
  props.closed(installing);
  emit('close');
}

async function fetchSpec(url: string): Promise<InstallSpec> {
  let lastError: any;

  for (const fetchUrl of getFetchUrls(url)) {
    try {
      const res = await fetch(fetchUrl, { credentials: 'omit' });

      if (!res.ok) {
        lastError = new Error(`${ res.status } ${ res.statusText }`.trim());
        continue;
      }

      return parseInstallSpec(await res.text());
    } catch (e) {
      if (e instanceof InstallSpecError) {
        throw e;
      }

      lastError = e;
    }
  }

  throw new Error(t('plugins.installFromUrl.error.fetch', { url, message: errorMessage(lastError) }));
}

/**
 * Wait for a repository to be downloaded and ready
 */
async function waitForRepo(name: string) {
  const start = Date.now();

  while (Date.now() - start < REPO_READY_TIMEOUT) {
    const repo = await store.dispatch('management/find', {
      type: CATALOG.CLUSTER_REPO,
      id:   name,
      opt:  { force: true }
    });

    const state = repo?.metadata?.state;

    if (state?.error) {
      throw new Error(state.message || state.name);
    }

    if (state?.name === 'active' && !state.transitioning && repo.status?.downloadTime) {
      return repo;
    }

    await wait(REPO_READY_INTERVAL);
  }

  throw new Error(t('plugins.installFromUrl.repos.timeout'));
}

/**
 * Wait for all of the repositories to be ready and load their charts
 */
async function syncRepos() {
  step.value = 'syncing';

  const results = await Promise.allSettled(repoPlans.value.map(async(plan) => {
    if (repoStatus.value[plan.name] === 'error') {
      return;
    }

    try {
      const repo = await waitForRepo(plan.name);

      repoStatus.value[plan.name] = 'ready';

      return repo;
    } catch (e) {
      repoStatus.value[plan.name] = 'error';
      errors.value.push(t('plugins.installFromUrl.repos.syncError', { name: plan.name, message: errorMessage(e) }));

      throw e;
    }
  }));

  const repoKeys = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => (r as PromiseFulfilledResult<any>).value._key);

  await Promise.all([
    repoKeys.length ? store.dispatch('catalog/load', { force: true, repoKeys }) : undefined,
    loadInstalledApps(),
  ]);

  showExtensions();
}

/**
 * Find out which extensions are already installed, so that we can show this before the user chooses what to install
 */
async function loadInstalledApps() {
  try {
    const apps = await store.dispatch('management/findAll', {
      type: CATALOG.APP,
      opt:  { namespaced: UI_PLUGIN_NAMESPACE, force: true },
    });

    installedApps.value = (apps || [])
      .filter((app: any) => app.metadata?.namespace === UI_PLUGIN_NAMESPACE)
      .map(toInstalledApp);
  } catch (e) {
    // Fall back to the installed state of the extensions shown on the Extensions page
    installedApps.value = [];
  }
}

// Clicking the extension's name or description toggles it, like clicking a checkbox label
function toggle(plan: ExtensionPlan) {
  if (!busy.value && plan.action !== 'none') {
    selected.value[plan.name] = !selected.value[plan.name];
  }
}

function showExtensions() {
  step.value = 'extensions';

  // Select everything that can be installed or upgraded
  selected.value = extensionPlans.value.reduce((acc, plan) => {
    acc[plan.name] = plan.action !== 'none';

    return acc;
  }, {} as Record<string, boolean>);
}

async function addRepos(btnCb: (success: boolean) => void) {
  errors.value = [];
  busy.value = true;

  for (const plan of reposToAdd.value) {
    try {
      const repoSpec = plan.isGit ? { gitRepo: plan.url, gitBranch: plan.branch } : { url: plan.url };
      const repo = await store.dispatch('management/create', {
        type:     CATALOG.CLUSTER_REPO,
        metadata: { name: plan.name },
        spec:     repoSpec,
      });

      await repo.save();
      repoStatus.value[plan.name] = 'pending';
    } catch (e) {
      repoStatus.value[plan.name] = 'error';
      errors.value.push(t('plugins.installFromUrl.repos.error', { name: plan.name, message: errorMessage(e) }));
    }
  }

  btnCb(true);
  busy.value = false;

  await syncRepos();
}

/**
 * Get the chart values to install an extension with
 */
async function chartValues(plan: ExtensionPlan, defaultRegistry: string) {
  const values: any = {};

  if (!defaultRegistry) {
    return values;
  }

  try {
    const info = await store.dispatch('catalog/getVersionInfo', {
      repoType:    plan.version.repoType,
      repoName:    plan.version.repoName,
      chartName:   plan.plugin.chart.chartName,
      versionName: plan.version.version,
    });

    // Pass in the system default registry if set - only if the image is in the rancher org
    if ((info?.values?.image?.repository || '').startsWith('rancher/')) {
      values.global = { cattle: { systemDefaultRegistry: defaultRegistry } };
    }
  } catch (e) {}

  return values;
}

async function installExtension(plan: ExtensionPlan, defaultRegistry: string) {
  const plugin = plan.plugin;
  const version = plan.version;
  const chartName = plugin.chart.chartName;
  const repo = store.getters['catalog/repo']({ repoType: version.repoType, repoName: version.repoName });

  const chart = {
    chartName,
    version:     version.version,
    releaseName: chartName,
    annotations: {
      [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: plugin.chart.repoType,
      [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: plugin.chart.repoName,
    },
    values: await chartValues(plan, defaultRegistry),
  };

  props.updateStatus(plugin.id, plan.action);

  try {
    // Extensions that are already installed were found when the extensions were listed
    await repo.doAction(plan.action, {
      charts:    [chart],
      namespace: UI_PLUGIN_NAMESPACE,
    });
  } catch (e) {
    props.updateStatus(plugin.id, false);

    throw e;
  }
}

async function install(btnCb: (success: boolean) => void) {
  errors.value = [];
  busy.value = true;

  let defaultRegistry = '';

  try {
    const setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.SYSTEM_DEFAULT_REGISTRY });

    defaultRegistry = setting?.value || '';
  } catch (e) {}

  const installing: ExtensionPlan[] = [];

  // Start the installs one at a time - the page tracks progress via the helm operations
  for (const plan of selectedPlans.value) {
    try {
      await installExtension(plan, defaultRegistry);
      installing.push(plan);
    } catch (e) {
      errors.value.push(t('plugins.installFromUrl.error.install', { name: plan.label, message: errorMessage(e) }));
    }
  }

  busy.value = false;

  if (errors.value.length) {
    btnCb(false);

    // Keep the dialog open to show the errors, but don't allow the same extensions to be installed again
    installing.forEach((plan) => {
      selected.value[plan.name] = false;
    });

    if (installing.length) {
      props.closed(installing);
    }

    return;
  }

  btnCb(true);
  close(installing);
}

onMounted(async() => {
  try {
    spec.value = await fetchSpec(props.url);

    const existing = await store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true } });

    repoPlans.value = planRepositories(spec.value.repositories, existing || []);

    if (reposToAdd.value.length) {
      step.value = 'repos';
    } else {
      await syncRepos();
    }
  } catch (e) {
    errors.value = [e instanceof InstallSpecError ? t(e.key) : errorMessage(e)];
    step.value = 'error';
  }
});
</script>

<template>
  <div
    class="install-from-url-dialog"
    data-testid="install-from-url-dialog"
  >
    <RcHeading
      :size="4"
      class="mt-10"
      data-modal-title
    >
      {{ t('plugins.installFromUrl.title') }}
    </RcHeading>

    <div class="dialog-panel mt-10">
      <!-- Loading the install information -->
      <div
        v-if="step === 'loading'"
        class="dialog-loading"
        data-testid="install-from-url-loading"
      >
        <i class="icon icon-spinner icon-spin mr-5" />
        <span>{{ t('plugins.installFromUrl.loading', { url }) }}</span>
      </div>

      <!-- Step 1 - add the repositories -->
      <template v-else-if="step === 'repos'">
        <p class="mb-15">
          {{ t('plugins.installFromUrl.repos.prompt') }}
        </p>
        <ul
          class="repo-list"
          data-testid="install-from-url-repos-to-add"
        >
          <li
            v-for="repo in reposToAdd"
            :key="repo.name"
            class="repo-item"
          >
            <RcIcon
              type="repository-alt"
              size="large"
              class="repo-icon"
            />
            <div class="repo-info">
              <div class="repo-name">
                {{ repo.name }}
              </div>
              <div class="repo-url text-muted">
                {{ repo.url }}<span v-if="repo.branch"> ({{ repo.branch }})</span>
              </div>
              <div
                v-if="repo.renamed"
                class="repo-renamed text-warning"
              >
                {{ t('plugins.installFromUrl.repos.renamed', { name: repo.specName, newName: repo.name }) }}
              </div>
            </div>
          </li>
        </ul>
        <template v-if="existingRepos.length">
          <p class="mt-10">
            {{ t('plugins.installFromUrl.repos.existing') }}
          </p>
          <ul class="repo-list">
            <li
              v-for="repo in existingRepos"
              :key="repo.name"
              class="repo-item"
            >
              <RcIcon
                type="repository-alt"
                size="large"
                class="repo-icon"
              />
              <div class="repo-info">
                <div class="repo-name">
                  {{ repo.name }}
                </div>
                <div class="repo-url text-muted">
                  {{ repo.url }}
                </div>
              </div>
            </li>
          </ul>
        </template>
      </template>

      <!-- Waiting for the repositories to be ready -->
      <template v-else-if="step === 'syncing'">
        <p>{{ t('plugins.installFromUrl.repos.syncing') }}</p>
        <ul
          class="repo-list"
          data-testid="install-from-url-repos-syncing"
        >
          <li
            v-for="repo in repoPlans"
            :key="repo.name"
            class="repo-status"
          >
            <i
              v-if="repoStatus[repo.name] === 'ready' || (!repoStatus[repo.name] && repo.exists)"
              class="icon icon-checkmark text-success"
            />
            <i
              v-else-if="repoStatus[repo.name] === 'error'"
              class="icon icon-error text-error"
            />
            <i
              v-else
              class="icon icon-spinner icon-spin"
            />
            <span class="repo-name">{{ repo.name }}</span>
          </li>
        </ul>
      </template>

      <!-- Step 2 - choose the extensions to install -->
      <template v-else-if="step === 'extensions'">
        <p
          v-if="extensionPlans.some((p) => p.action !== 'none')"
          class="mb-15"
        >
          {{ t('plugins.installFromUrl.extensions.prompt') }}
        </p>
        <Banner
          v-else
          color="info"
          :label="t('plugins.installFromUrl.extensions.none')"
        />
        <ul
          class="extension-list"
          data-testid="install-from-url-extensions"
        >
          <li
            v-for="plan in extensionPlans"
            :key="plan.name"
            :data-testid="`install-from-url-extension-${ plan.name }`"
            :class="{ disabled: plan.action === 'none' }"
          >
            <Checkbox
              v-model:value="selected[plan.name]"
              :disabled="busy || plan.action === 'none'"
              :alternate-label="plan.label"
            />
            <img
              v-if="plan.plugin?.icon || defaultIcon"
              class="extension-icon"
              :src="plan.plugin?.icon || defaultIcon"
              alt=""
            >
            <div
              class="extension-info"
              @click="toggle(plan)"
            >
              <div class="extension-label">
                {{ plan.label }}
              </div>
              <div
                class="extension-description"
                :class="{ 'text-muted': plan.action === 'none' }"
              >
                {{ extensionDescription(plan) }}
              </div>
            </div>
          </li>
        </ul>
        <Banner
          v-if="extensionPlans.some((p) => p.action !== 'none' && !p.plugin?.certified)"
          color="warning"
          :label="t('plugins.install.warnNotCertified')"
        />
      </template>

      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
        data-testid="install-from-url-error"
      />
    </div>

    <div class="dialog-buttons">
      <button
        class="btn role-secondary"
        :disabled="busy"
        data-testid="install-from-url-cancel-btn"
        @click="close()"
      >
        {{ t(step === 'error' ? 'generic.close' : 'generic.cancel') }}
      </button>
      <AsyncButton
        v-if="step === 'repos'"
        mode="add"
        icon="icon-plus"
        :action-label="t('plugins.installFromUrl.repos.button')"
        data-testid="install-from-url-add-repos-btn"
        @click="addRepos"
      />
      <AsyncButton
        v-else-if="step === 'extensions'"
        mode="install"
        icon="icon-plus"
        :action-label="t('plugins.installFromUrl.extensions.button')"
        :disabled="!selectedPlans.length"
        data-testid="install-from-url-install-btn"
        @click="install"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '@shell/assets/styles/base/_mixins.scss';

  .install-from-url-dialog {
    @include extension-dialog;

    .dialog-loading {
      display: flex;
      align-items: center;
      word-break: break-all;
    }

    .repo-list, .extension-list {
      list-style: none;
      // Padding stops the scroll container from clipping the focus outline of the checkboxes
      margin: 0 -4px 8px -4px;
      padding: 4px;
      max-height: 320px;
      overflow-y: auto;

      > li {
        padding: 6px 0;
      }
    }

    .extension-list > li {
      display: flex;
      align-items: center;
      gap: 12px;

      &.disabled .extension-icon {
        opacity: 0.6;
      }

      .extension-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .extension-info {
        flex: 1;
        min-width: 0;
        cursor: pointer;
      }

      &.disabled .extension-info {
        cursor: default;
      }

      .extension-label {
        font-weight: 600;
      }
    }

    .repo-item {
      display: flex;
      align-items: center;
      gap: 12px;

      .repo-icon {
        flex-shrink: 0;
        color: var(--primary);
      }

      .repo-info {
        flex: 1;
        min-width: 0;
      }
    }

    .repo-name {
      font-weight: 600;
    }

    .repo-url {
      word-break: break-all;
    }

    .repo-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .extension-description {
      font-size: 13px;
    }
  }
</style>
