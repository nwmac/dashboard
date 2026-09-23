import { flushPromises, shallowMount, VueWrapper } from '@vue/test-utils';
import InstallExtensionsFromUrlDialog from '@shell/dialog/InstallExtensionsFromUrlDialog.vue';
import AsyncButton from '@shell/components/AsyncButton';
import { Checkbox } from '@components/Form/Checkbox';
import Banner from '@components/Banner/Banner.vue';
import { RcIcon } from '@components/RcIcon';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { INSTALL_SPEC_TYPE } from '@shell/utils/uiplugins-install-from-url';

jest.mock('@shell/utils/async', () => ({ wait: jest.fn(() => Promise.resolve()) }));
jest.mock('@shell/config/version', () => ({ isRancherPrime: () => false, getVersionData: () => ({}) }));

const URL = 'https://github.com/owner/repo';

const README = `# Install

<details>
<summary>Install</summary>

\`\`\`yaml
type: ${ INSTALL_SPEC_TYPE }
repositories:
  - name: repo-a
    url: https://a.github.io/repo-a
  - name: repo-b
    url: https://b.github.io/repo-b
extensions:
  - ext-a
  - ext-b
\`\`\`
</details>
`;

const readyRepo = (name: string) => ({
  _key:     `key-${ name }`,
  metadata: { name, state: { name: 'active', transitioning: false } },
  status:   { downloadTime: '2026-01-01T00:00:00Z' },
});

const version = (v: string, repoName: string) => ({
  version: v, appVersion: v, repoType: 'cluster', repoName
});

const plugin = (name: string, repoName: string, extra = {}) => ({
  id:        `cluster/${ repoName }/${ name }`,
  name,
  label:     `${ name } label`,
  certified: true,
  chart:     {
    chartName: name, repoName, repoType: 'cluster'
  },
  installableVersions: [version('2.0.0', repoName), version('1.0.0', repoName)],
  installed:           false,
  ...extra,
});

const app = (name: string, v: string, repoName: string) => ({
  metadata: {
    name, namespace: UI_PLUGIN_NAMESPACE, labels: { 'catalog.cattle.io/cluster-repo-name': repoName }
  },
  spec: { chart: { metadata: { version: v, appVersion: v } } },
});

describe('component: InstallExtensionsFromUrlDialog', () => {
  let wrapper: VueWrapper<any>;
  let existingRepos: any[];
  let apps: any[] | null; // null - the apps can not be loaded
  let repoStates: Record<string, any>;
  let created: any[];
  let catalogRepo: any;
  let plugins: any[];
  let store: any;

  const mountComponent = async(props = {}) => {
    store = {
      getters:  { 'catalog/repo': jest.fn(() => catalogRepo) },
      dispatch: jest.fn((action: string, args: any) => {
        switch (action) {
        case 'management/findAll':
          if (args.type === CATALOG.APP) {
            return apps ? Promise.resolve(apps) : Promise.reject(new Error('forbidden'));
          }

          return Promise.resolve(existingRepos);
        case 'management/find':
          if (args.type === CATALOG.CLUSTER_REPO) {
            return Promise.resolve(repoStates[args.id] || readyRepo(args.id));
          }
          if (args.type === MANAGEMENT.SETTING) {
            return Promise.resolve({ value: '' });
          }

          return Promise.reject(new Error('not found'));
        case 'management/create': {
          const model = { ...args, save: jest.fn(() => Promise.resolve()) };

          created.push(model);

          return Promise.resolve(model);
        }
        default:
          return Promise.resolve();
        }
      }),
    };

    wrapper = shallowMount(InstallExtensionsFromUrlDialog, {
      props: {
        url:          URL,
        getPlugins:   () => plugins,
        updateStatus: jest.fn(),
        closed:       jest.fn(),
        ...props,
      },
      global: { provide: { store } },
    });

    await flushPromises();

    return wrapper;
  };

  const findButton = (testId: string) => wrapper.findAllComponents(AsyncButton).find((b) => b.attributes('data-testid') === testId);
  const clickAsyncButton = async(testId: string) => {
    const cb = jest.fn();

    findButton(testId)?.vm.$emit('click', cb);
    await flushPromises();

    return cb;
  };
  const errorLabels = () => wrapper.findAllComponents(Banner).filter((b) => b.attributes('data-testid') === 'install-from-url-error').map((b) => b.props('label'));

  beforeEach(() => {
    existingRepos = [];
    apps = [];
    repoStates = {};
    created = [];
    catalogRepo = { doAction: jest.fn(() => Promise.resolve({})) };
    plugins = [plugin('ext-a', 'repo-a'), plugin('ext-b', 'repo-b')];
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(README)
    })) as any;
  });

  describe('fetching the install information', () => {
    it('should fetch the raw README for a GitHub repository', async() => {
      await mountComponent();

      expect(global.fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/HEAD/README.md', { credentials: 'omit' });
    });

    it('should try the next URL if a fetch fails', async() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false, status: 404, statusText: 'Not Found'
        })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(README) }) as any;

      await mountComponent();

      expect(global.fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/HEAD/readme.md', { credentials: 'omit' });
      expect(wrapper.find('[data-testid="install-from-url-repos-to-add"]').exists()).toBe(true);
    });

    it('should show an error if the URL can not be fetched', async() => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch'))) as any;

      await mountComponent();

      expect(errorLabels()).toStrictEqual([`plugins.installFromUrl.error.fetch-${ JSON.stringify({ url: URL, message: 'Failed to fetch' }) }`]);
    });

    it('should show an error if there is no install information', async() => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('# Nothing') })) as any;

      await mountComponent();

      expect(errorLabels()).toStrictEqual(['plugins.installFromUrl.error.notFound']);
    });

    it('should only show the close button on error', async() => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed'))) as any;

      await mountComponent();

      expect(wrapper.findAllComponents(AsyncButton)).toHaveLength(0);
      expect(wrapper.find('[data-testid="install-from-url-cancel-btn"]').text()).toBe('%generic.close%');
    });
  });

  describe('adding repositories', () => {
    it('should list the repositories to add', async() => {
      await mountComponent();

      const items = wrapper.findAll('[data-testid="install-from-url-repos-to-add"] li');

      expect(items.map((i) => i.find('.repo-name').text())).toStrictEqual(['repo-a', 'repo-b']);
    });

    it('should show a repository icon for each repository', async() => {
      existingRepos = [{ metadata: { name: 'mine' }, spec: { url: 'https://a.github.io/repo-a' } }];

      await mountComponent();

      const icons = wrapper.findAllComponents(RcIcon);

      expect(icons).toHaveLength(2);
      expect(icons.map((i) => i.props('type'))).toStrictEqual(['repository-alt', 'repository-alt']);
    });

    it('should only list repositories that have not already been added', async() => {
      existingRepos = [{ metadata: { name: 'mine' }, spec: { url: 'https://a.github.io/repo-a' } }];

      await mountComponent();

      const items = wrapper.findAll('[data-testid="install-from-url-repos-to-add"] li');

      expect(items.map((i) => i.find('.repo-name').text())).toStrictEqual(['repo-b']);
    });

    it('should explain when a repository name is already in use', async() => {
      existingRepos = [{ metadata: { name: 'repo-a' }, spec: { url: 'https://other.io' } }];

      await mountComponent();

      const renamed = wrapper.find('.repo-renamed');

      expect(renamed.text()).toBe('%plugins.installFromUrl.repos.renamed%');
    });

    it('should create the repositories when Add Repositories is pressed', async() => {
      existingRepos = [{ metadata: { name: 'repo-a' }, spec: { url: 'https://other.io' } }];

      await mountComponent();
      const cb = await clickAsyncButton('install-from-url-add-repos-btn');

      expect(cb).toHaveBeenCalledWith(true);
      expect(created.map((c) => [c.metadata.name, c.spec])).toStrictEqual([
        ['repo-a-1', { url: 'https://a.github.io/repo-a' }],
        ['repo-b', { url: 'https://b.github.io/repo-b' }],
      ]);
      expect(created[0].save).toHaveBeenCalledWith();
    });

    it('should load the charts for the repositories once they are ready', async() => {
      await mountComponent();
      await clickAsyncButton('install-from-url-add-repos-btn');

      expect(store.dispatch).toHaveBeenCalledWith('catalog/load', { force: true, repoKeys: ['key-repo-a', 'key-repo-b'] });
      expect(wrapper.find('[data-testid="install-from-url-extensions"]').exists()).toBe(true);
    });

    it('should wait for a repository to be downloaded', async() => {
      let calls = 0;

      repoStates = {
        get 'repo-a'() {
          calls++;

          return calls < 3 ? { metadata: { name: 'repo-a', state: { name: 'in-progress', transitioning: true } } } : readyRepo('repo-a');
        }
      };

      await mountComponent();
      await clickAsyncButton('install-from-url-add-repos-btn');

      expect(calls).toBe(3);
      expect(wrapper.find('[data-testid="install-from-url-extensions"]').exists()).toBe(true);
    });

    it('should show an error if a repository fails to sync, and continue with the other repositories', async() => {
      repoStates = {
        'repo-a': {
          metadata: {
            name:  'repo-a',
            state: {
              name: 'error', error: true, message: 'bad index'
            }
          }
        }
      };

      await mountComponent();
      await clickAsyncButton('install-from-url-add-repos-btn');

      expect(errorLabels()).toStrictEqual([`plugins.installFromUrl.repos.syncError-${ JSON.stringify({ name: 'repo-a', message: 'bad index' }) }`]);
      expect(store.dispatch).toHaveBeenCalledWith('catalog/load', { force: true, repoKeys: ['key-repo-b'] });
    });

    it('should show an error if a repository can not be created', async() => {
      await mountComponent();

      store.dispatch.mockImplementationOnce(() => Promise.reject(new Error('forbidden')));
      await clickAsyncButton('install-from-url-add-repos-btn');

      expect(errorLabels()).toStrictEqual([`plugins.installFromUrl.repos.error-${ JSON.stringify({ name: 'repo-a', message: 'forbidden' }) }`]);
      expect(store.dispatch).toHaveBeenCalledWith('catalog/load', { force: true, repoKeys: ['key-repo-b'] });
    });

    it('should skip adding repositories if they have all been added', async() => {
      existingRepos = [
        { metadata: { name: 'a' }, spec: { url: 'https://a.github.io/repo-a' } },
        { metadata: { name: 'b' }, spec: { url: 'https://b.github.io/repo-b/' } },
      ];
      plugins = [plugin('ext-a', 'a'), plugin('ext-b', 'b')];

      await mountComponent();

      expect(created).toStrictEqual([]);
      expect(store.dispatch).toHaveBeenCalledWith('catalog/load', { force: true, repoKeys: ['key-a', 'key-b'] });
      expect(wrapper.find('[data-testid="install-from-url-repos-to-add"]').exists()).toBe(false);
      expect(wrapper.findAll('[data-testid="install-from-url-extensions"] li')).toHaveLength(2);
    });
  });

  describe('installing extensions', () => {
    const showExtensions = async() => {
      existingRepos = [
        { metadata: { name: 'repo-a' }, spec: { url: 'https://a.github.io/repo-a' } },
        { metadata: { name: 'repo-b' }, spec: { url: 'https://b.github.io/repo-b' } },
      ];

      await mountComponent();
    };

    const checkbox = (name: string) => wrapper.find(`[data-testid="install-from-url-extension-${ name }"]`).findComponent(Checkbox);

    it('should select the extensions that can be installed', async() => {
      await showExtensions();

      expect(checkbox('ext-a').props('value')).toBe(true);
      expect(checkbox('ext-a').props('disabled')).toBe(false);
    });

    it('should show the latest version to install', async() => {
      await showExtensions();

      const description = wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-description');

      expect(description.text()).toBe(`plugins.installFromUrl.extensions.version-${ JSON.stringify({ version: '2.0.0' }) }`);
    });

    it('should offer to upgrade an extension that is not the latest version', async() => {
      plugins[0] = plugin('ext-a', 'repo-a', { installed: true, installedVersion: '1.0.0' });

      await showExtensions();

      const description = wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-description');

      expect(description.text()).toBe(`plugins.installFromUrl.extensions.upgrade-${ JSON.stringify({ from: '1.0.0', to: '2.0.0' }) }`);
      expect(checkbox('ext-a').props('value')).toBe(true);
    });

    it('should disable an extension that is already the latest version', async() => {
      plugins[0] = plugin('ext-a', 'repo-a', { installed: true, installedVersion: '2.0.0' });

      await showExtensions();

      expect(checkbox('ext-a').props('value')).toBe(false);
      expect(checkbox('ext-a').props('disabled')).toBe(true);
    });

    it('should disable an extension that can not be found', async() => {
      plugins = [plugin('ext-a', 'repo-a')];

      await showExtensions();

      const description = wrapper.find('[data-testid="install-from-url-extension-ext-b"] .extension-description');

      expect(description.text()).toBe(`plugins.installFromUrl.extensions.reason.notFound-${ JSON.stringify({}) }`);
      expect(checkbox('ext-b').props('disabled')).toBe(true);
    });

    it('should show a message when there is nothing to install', async() => {
      plugins = [];

      await showExtensions();

      const labels = wrapper.findAllComponents(Banner).map((b) => b.props('label'));

      expect(labels).toStrictEqual(['%plugins.installFromUrl.extensions.none%']);
      expect(findButton('install-from-url-install-btn')?.props('disabled')).toBe(true);
    });

    it('should install the selected extensions', async() => {
      await showExtensions();

      const closed = wrapper.props('closed') as jest.Mock;
      const cb = await clickAsyncButton('install-from-url-install-btn');

      expect(cb).toHaveBeenCalledWith(true);
      expect(catalogRepo.doAction).toHaveBeenCalledTimes(2);
      expect(catalogRepo.doAction).toHaveBeenCalledWith('install', {
        charts: [{
          chartName:   'ext-a',
          version:     '2.0.0',
          releaseName: 'ext-a',
          annotations: {
            'catalog.cattle.io/ui-source-repo-type': 'cluster',
            'catalog.cattle.io/ui-source-repo':      'repo-a',
          },
          values: {},
        }],
        namespace: UI_PLUGIN_NAMESPACE,
      });
      expect(closed.mock.calls[0][0].map((p: any) => p.name)).toStrictEqual(['ext-a', 'ext-b']);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should update the install status of each extension', async() => {
      await showExtensions();
      await clickAsyncButton('install-from-url-install-btn');

      const updateStatus = wrapper.props('updateStatus') as jest.Mock;

      expect(updateStatus).toHaveBeenCalledWith('cluster/repo-a/ext-a', 'install');
      expect(updateStatus).toHaveBeenCalledWith('cluster/repo-b/ext-b', 'install');
    });

    it('should not install extensions that are unchecked', async() => {
      await showExtensions();

      checkbox('ext-b').vm.$emit('update:value', false);
      await clickAsyncButton('install-from-url-install-btn');

      expect(catalogRepo.doAction).toHaveBeenCalledTimes(1);
      expect(catalogRepo.doAction.mock.calls[0][1].charts[0].chartName).toBe('ext-a');
    });

    it('should upgrade an installed extension', async() => {
      plugins[0] = plugin('ext-a', 'repo-a', { installed: true, installedVersion: '1.0.0' });

      await showExtensions();
      checkbox('ext-b').vm.$emit('update:value', false);
      await clickAsyncButton('install-from-url-install-btn');

      expect(catalogRepo.doAction.mock.calls[0][0]).toBe('upgrade');
      expect(wrapper.props('updateStatus')).toHaveBeenCalledWith('cluster/repo-a/ext-a', 'upgrade');
    });

    it('should load the installed extensions before listing the extensions', async() => {
      await showExtensions();

      expect(store.dispatch).toHaveBeenCalledWith('management/findAll', {
        type: CATALOG.APP,
        opt:  { namespaced: UI_PLUGIN_NAMESPACE, force: true },
      });
    });

    it('should show an extension as installed when its app is already at the latest version', async() => {
      apps = [app('ext-a', '2.0.0', 'repo-a')];

      await showExtensions();

      const description = wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-description');

      expect(description.text()).toBe(`plugins.installFromUrl.extensions.reason.installed-${ JSON.stringify({ version: '2.0.0' }) }`);
      expect(checkbox('ext-a').props('disabled')).toBe(true);
      expect(checkbox('ext-a').props('value')).toBe(false);
    });

    it('should offer to upgrade an extension when its app is an older version', async() => {
      apps = [app('ext-a', '1.0.0', 'repo-a')];

      await showExtensions();
      checkbox('ext-b').vm.$emit('update:value', false);
      await clickAsyncButton('install-from-url-install-btn');

      expect(catalogRepo.doAction.mock.calls[0][0]).toBe('upgrade');
    });

    it('should not install an extension whose app was installed from a different repository', async() => {
      apps = [app('ext-a', '1.0.0', 'other-repo')];

      await showExtensions();

      const description = wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-description');

      expect(description.text()).toBe(`plugins.installFromUrl.extensions.reason.installedFromOtherRepo-${ JSON.stringify({ version: '1.0.0' }) }`);
      expect(checkbox('ext-a').props('disabled')).toBe(true);
    });

    it('should ignore apps in other namespaces', async() => {
      apps = [{ ...app('ext-a', '2.0.0', 'repo-a'), metadata: { name: 'ext-a', namespace: 'default' } }];

      await showExtensions();

      expect(checkbox('ext-a').props('disabled')).toBe(false);
    });

    it('should fall back to the installed state on the page if the apps can not be loaded', async() => {
      plugins[0] = plugin('ext-a', 'repo-a', { installed: true, installedVersion: '2.0.0' });
      apps = null;

      await showExtensions();

      expect(checkbox('ext-a').props('disabled')).toBe(true);
    });

    it('should show the icon of each extension', async() => {
      plugins[0] = plugin('ext-a', 'repo-a', { icon: 'https://a.io/icon.svg' });

      await showExtensions();

      const icon = wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-icon');

      expect(icon.attributes('src')).toBe('https://a.io/icon.svg');
      expect(icon.attributes('alt')).toBe('');
    });

    it('should show the default icon for an extension without one', async() => {
      existingRepos = [
        { metadata: { name: 'repo-a' }, spec: { url: 'https://a.github.io/repo-a' } },
        { metadata: { name: 'repo-b' }, spec: { url: 'https://b.github.io/repo-b' } },
      ];

      await mountComponent({ defaultIcon: 'default.svg' });

      const icon = wrapper.find('[data-testid="install-from-url-extension-ext-b"] .extension-icon');

      expect(icon.attributes('src')).toBe('default.svg');
    });

    it('should not show an icon when there is no icon or default icon', async() => {
      await showExtensions();

      expect(wrapper.find('[data-testid="install-from-url-extension-ext-b"] .extension-icon').exists()).toBe(false);
    });

    it('should toggle an extension when its name is clicked', async() => {
      await showExtensions();

      await wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-info').trigger('click');

      expect(checkbox('ext-a').props('value')).toBe(false);
    });

    it('should not toggle an extension that can not be installed when its name is clicked', async() => {
      apps = [app('ext-a', '2.0.0', 'repo-a')];

      await showExtensions();
      await wrapper.find('[data-testid="install-from-url-extension-ext-a"] .extension-info').trigger('click');

      expect(checkbox('ext-a').props('value')).toBe(false);
    });

    it('should set the system default registry for rancher images', async() => {
      await showExtensions();

      const dispatch = store.dispatch.getMockImplementation();

      store.dispatch.mockImplementation((action: string, args: any) => {
        if (args?.type === MANAGEMENT.SETTING) {
          return Promise.resolve({ value: 'registry.example.com' });
        }
        if (action === 'catalog/getVersionInfo') {
          return Promise.resolve({ values: { image: { repository: 'rancher/ui-plugin' } } });
        }

        return dispatch(action, args);
      });
      checkbox('ext-b').vm.$emit('update:value', false);
      await clickAsyncButton('install-from-url-install-btn');

      expect(catalogRepo.doAction.mock.calls[0][1].charts[0].values).toStrictEqual({ global: { cattle: { systemDefaultRegistry: 'registry.example.com' } } });
    });

    it('should show an error and keep the dialog open if an install fails', async() => {
      catalogRepo.doAction = jest.fn()
        .mockRejectedValueOnce(new Error('helm failed'))
        .mockResolvedValueOnce({});

      await showExtensions();

      const cb = await clickAsyncButton('install-from-url-install-btn');

      expect(cb).toHaveBeenCalledWith(false);
      expect(errorLabels()).toStrictEqual([`plugins.installFromUrl.error.install-${ JSON.stringify({ name: 'ext-a label', message: 'helm failed' }) }`]);
      expect(wrapper.emitted('close')).toBeUndefined();
      expect(wrapper.props('updateStatus')).toHaveBeenCalledWith('cluster/repo-a/ext-a', false);
      expect((wrapper.props('closed') as jest.Mock).mock.calls[0][0].map((p: any) => p.name)).toStrictEqual(['ext-b']);
      expect(checkbox('ext-b').props('value')).toBe(false);
    });
  });

  it('should call closed with no extensions when cancelled', async() => {
    await mountComponent();

    await wrapper.find('[data-testid="install-from-url-cancel-btn"]').trigger('click');

    expect(wrapper.props('closed')).toHaveBeenCalledWith([]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
