import {
  INSTALL_SPEC_TYPE,
  InstallSpecError,
  getDroppedUrl,
  getFetchUrls,
  isHttpUrl,
  isUrlDrag,
  normalizeRepoUrl,
  parseInstallSpec,
  planExtensions,
  planRepositories,
  toInstalledApp,
  validateInstallSpec,
} from '@shell/utils/uiplugins-install-from-url';

jest.mock('@shell/config/version', () => ({ isRancherPrime: () => false, getVersionData: () => ({}) }));

const SPEC_YAML = `type: ${ INSTALL_SPEC_TYPE }
repositories:
  - name: repo-a
    url: https://example.github.io/repo-a
  - name: repo-b
    url: https://example.github.io/repo-b
extensions:
  - ext-a
  - ext-b
`;

const EXPECTED_SPEC = {
  repositories: [
    { name: 'repo-a', url: 'https://example.github.io/repo-a' },
    { name: 'repo-b', url: 'https://example.github.io/repo-b' },
  ],
  extensions: [{ name: 'ext-a' }, { name: 'ext-b' }],
};

function dataTransfer(data: Record<string, string>, types = Object.keys(data)): DataTransfer {
  return { types, getData: (type: string) => data[type] || '' } as unknown as DataTransfer;
}

describe('utils: uiplugins-install-from-url', () => {
  describe('isHttpUrl', () => {
    it.each([
      ['https://example.com', true],
      ['http://example.com/path?q=1', true],
      ['  https://example.com  ', true],
      ['ftp://example.com', false],
      ['javascript:alert(1)', false],
      ['example.com', false],
      ['https://', false],
      ['', false],
      [undefined, false],
    ])('should return %p for %p', (value, expected) => {
      expect(isHttpUrl(value)).toBe(expected);
    });
  });

  describe('isUrlDrag', () => {
    it.each([
      [['text/uri-list'], true],
      [['text/plain'], true],
      [['text/uri-list', 'text/plain'], true],
      [['Files'], false],
      [['Files', 'text/uri-list'], false],
      [['text/html'], false],
      [[], false],
    ])('should return the expected result for types %p', (types, expected) => {
      expect(isUrlDrag(dataTransfer({}, types))).toBe(expected);
    });

    it('should return false when there is no data transfer', () => {
      expect(isUrlDrag(null)).toBe(false);
    });
  });

  describe('getDroppedUrl', () => {
    it('should return the first URL in the uri list, ignoring comments', () => {
      const dt = dataTransfer({ 'text/uri-list': '# comment\r\nhttps://a.com\r\nhttps://b.com' });

      expect(getDroppedUrl(dt)).toBe('https://a.com');
    });

    it('should fall back to the plain text', () => {
      const dt = dataTransfer({ 'text/plain': ' https://a.com ' });

      expect(getDroppedUrl(dt)).toBe('https://a.com');
    });

    it('should return undefined if the dropped text is not a URL', () => {
      const dt = dataTransfer({ 'text/plain': 'some text' });

      expect(getDroppedUrl(dt)).toBeUndefined();
    });

    it('should return undefined when there is no data transfer', () => {
      expect(getDroppedUrl(undefined)).toBeUndefined();
    });
  });

  describe('getFetchUrls', () => {
    it.each([
      ['https://github.com/owner/repo', ['https://raw.githubusercontent.com/owner/repo/HEAD/README.md', 'https://raw.githubusercontent.com/owner/repo/HEAD/readme.md']],
      ['https://github.com/owner/repo.git', ['https://raw.githubusercontent.com/owner/repo/HEAD/README.md', 'https://raw.githubusercontent.com/owner/repo/HEAD/readme.md']],
      ['https://www.github.com/owner/repo/', ['https://raw.githubusercontent.com/owner/repo/HEAD/README.md', 'https://raw.githubusercontent.com/owner/repo/HEAD/readme.md']],
      ['https://github.com/owner/repo/blob/main/docs/install.md', ['https://raw.githubusercontent.com/owner/repo/main/docs/install.md']],
      ['https://github.com/owner/repo/tree/dev', ['https://raw.githubusercontent.com/owner/repo/dev/README.md', 'https://raw.githubusercontent.com/owner/repo/dev/readme.md']],
      ['https://github.com/owner/repo/tree/dev/sub', ['https://raw.githubusercontent.com/owner/repo/dev/sub/README.md', 'https://raw.githubusercontent.com/owner/repo/dev/sub/readme.md']],
      ['https://github.com/owner/repo/issues', ['https://github.com/owner/repo/issues']],
      ['https://github.com/owner', ['https://github.com/owner']],
      ['https://example.com/install.md', ['https://example.com/install.md']],
      ['not a url', ['not a url']],
    ])('should map %p', (url, expected) => {
      expect(getFetchUrls(url)).toStrictEqual(expected);
    });
  });

  describe('parseInstallSpec', () => {
    it('should parse a yaml block in a details element in markdown', () => {
      const md = `# Title\n\n<details>\n  <summary>Install</summary>\n\n\`\`\`yaml\n${ SPEC_YAML }\`\`\`\n</details>\n`;

      expect(parseInstallSpec(md)).toStrictEqual(EXPECTED_SPEC);
    });

    it('should parse a yaml block in a details element in html', () => {
      // GitHub wraps tokens of highlighted code in spans
      const encoded = SPEC_YAML.replace(/:/g, '<span class="pl-ent">:</span>');
      const html = `<html><body><details open><summary>Install</summary><div class="highlight"><pre lang="yaml">${ encoded }</pre></div></details></body></html>`;

      expect(parseInstallSpec(html)).toStrictEqual(EXPECTED_SPEC);
    });

    it('should decode html entities in a pre block', () => {
      const yaml = `type: ${ INSTALL_SPEC_TYPE }\nrepositories:\n  - name: a&amp;b\n    url: https://a.com\nextensions:\n  - ext`;
      const html = `<details><pre>${ yaml }</pre></details>`;

      expect(parseInstallSpec(html).repositories[0].name).toBe('a&b');
    });

    it('should skip yaml blocks in details elements that are not install information', () => {
      const md = `<details>\n\n\`\`\`yaml\nfoo: bar\n\`\`\`\n</details>\n<details>\n\n\`\`\`yml\n${ SPEC_YAML }\`\`\`\n</details>`;

      expect(parseInstallSpec(md)).toStrictEqual(EXPECTED_SPEC);
    });

    it('should ignore yaml blocks that are not in a details element', () => {
      const md = `# Title\n\n\`\`\`yaml\n${ SPEC_YAML }\`\`\`\n`;

      expect(() => parseInstallSpec(md)).toThrow(InstallSpecError);
    });

    it('should accept content that is the yaml itself', () => {
      expect(parseInstallSpec(SPEC_YAML)).toStrictEqual(EXPECTED_SPEC);
    });

    it('should ignore invalid yaml', () => {
      const md = `<details>\n\n\`\`\`yaml\n: - : bad\n  yaml: [\n\`\`\`\n</details>`;

      expect(() => parseInstallSpec(md)).toThrow('plugins.installFromUrl.error.notFound');
    });

    it('should throw when there is no install information', () => {
      expect(() => parseInstallSpec('<html>Nothing here</html>')).toThrow('plugins.installFromUrl.error.notFound');
    });

    it('should throw for empty content', () => {
      expect(() => parseInstallSpec('')).toThrow('plugins.installFromUrl.error.notFound');
    });
  });

  describe('validateInstallSpec', () => {
    it('should accept extensions as objects with a repository', () => {
      const spec = validateInstallSpec({
        type:         INSTALL_SPEC_TYPE,
        repositories: [{
          name: ' a ', url: 'https://a.com', branch: 'main'
        }],
        extensions: [{ name: 'ext', repository: 'a' }, 'other'],
      });

      expect(spec).toStrictEqual({
        repositories: [{
          name: 'a', url: 'https://a.com', branch: 'main'
        }],
        extensions: [{ name: 'ext', repository: 'a' }, { name: 'other' }],
      });
    });

    it('should allow there to be no repositories', () => {
      const spec = validateInstallSpec({ type: INSTALL_SPEC_TYPE, extensions: ['ext'] });

      expect(spec.repositories).toStrictEqual([]);
    });

    it.each([
      ['wrong type', { type: 'other', extensions: ['ext'] }, 'plugins.installFromUrl.error.notFound'],
      ['null', null, 'plugins.installFromUrl.error.notFound'],
      ['repo without a url', {
        type: INSTALL_SPEC_TYPE, repositories: [{ name: 'a' }], extensions: ['ext']
      }, 'plugins.installFromUrl.error.invalidRepo'],
      ['repo with a non http url', {
        type: INSTALL_SPEC_TYPE, repositories: [{ name: 'a', url: 'file:///etc/passwd' }], extensions: ['ext']
      }, 'plugins.installFromUrl.error.invalidRepo'],
      ['repo without a name', {
        type: INSTALL_SPEC_TYPE, repositories: [{ url: 'https://a.com' }], extensions: ['ext']
      }, 'plugins.installFromUrl.error.invalidRepo'],
      ['invalid extension', { type: INSTALL_SPEC_TYPE, extensions: [42] }, 'plugins.installFromUrl.error.invalidExtension'],
      ['empty extension name', { type: INSTALL_SPEC_TYPE, extensions: [' '] }, 'plugins.installFromUrl.error.invalidExtension'],
      ['no extensions', { type: INSTALL_SPEC_TYPE, repositories: [] }, 'plugins.installFromUrl.error.noExtensions'],
    ])('should reject %s', (_, data, key) => {
      expect(() => validateInstallSpec(data)).toThrow(key);
    });
  });

  describe('normalizeRepoUrl', () => {
    it.each([
      ['https://Example.com/Repo/', 'https://example.com/repo'],
      ['https://github.com/a/b.git', 'https://github.com/a/b'],
      [' https://a.com// ', 'https://a.com'],
      [undefined, ''],
    ])('should normalize %p', (url, expected) => {
      expect(normalizeRepoUrl(url)).toBe(expected);
    });
  });

  describe('planRepositories', () => {
    const httpRepo = (name: string, url: string) => ({ metadata: { name }, spec: { url } });
    const gitRepo = (name: string, gitRepo: string, gitBranch?: string) => ({ metadata: { name }, spec: { gitRepo, gitBranch } });

    it('should add repositories that do not exist', () => {
      const plans = planRepositories([{ name: 'a', url: 'https://a.io/charts' }], []);

      expect(plans).toStrictEqual([{
        specName: 'a',
        name:     'a',
        url:      'https://a.io/charts',
        branch:   undefined,
        isGit:    false,
        exists:   false,
        renamed:  false,
      }]);
    });

    it('should re-use an existing repository with the same url', () => {
      const plans = planRepositories([{ name: 'a', url: 'https://a.io/charts/' }], [httpRepo('my-repo', 'https://A.io/charts')]);

      expect(plans[0]).toStrictEqual(expect.objectContaining({
        name: 'my-repo', exists: true, renamed: false
      }));
    });

    it('should append a number when the name is used by a different repository', () => {
      const plans = planRepositories(
        [{ name: 'a', url: 'https://a.io/charts' }],
        [httpRepo('a', 'https://other.io'), httpRepo('a-1', 'https://other2.io')]
      );

      expect(plans[0]).toStrictEqual(expect.objectContaining({
        name: 'a-2', exists: false, renamed: true
      }));
    });

    it('should give repositories in the same spec different names', () => {
      const plans = planRepositories([{ name: 'a', url: 'https://a.io' }, { name: 'a', url: 'https://b.io' }], []);

      expect(plans.map((p) => p.name)).toStrictEqual(['a', 'a-1']);
    });

    it('should convert names to valid resource names', () => {
      const plans = planRepositories([{ name: 'My Repo!', url: 'https://a.io' }], []);

      expect(plans[0]).toStrictEqual(expect.objectContaining({ name: 'my-repo', renamed: true }));
    });

    it('should use a default name if the name has no valid characters', () => {
      const plans = planRepositories([{ name: '!!!', url: 'https://a.io' }], []);

      expect(plans[0].name).toBe('extensions');
    });

    it.each([
      [{ name: 'a', url: 'https://a.io/charts' }, false],
      [{ name: 'a', url: 'https://github.com/a/b' }, true],
      [{ name: 'a', url: 'https://gitlab.com/a/b.git' }, true],
      [{
        name: 'a', url: 'https://a.io/charts', branch: 'main'
      }, true],
    ])('should determine if %p is a git repository', (specRepo, expected) => {
      expect(planRepositories([specRepo], [])[0].isGit).toBe(expected);
    });

    it('should re-use an existing git repository with the same url and branch', () => {
      const plans = planRepositories(
        [{
          name: 'a', url: 'https://github.com/a/b', branch: 'gh-pages'
        }],
        [gitRepo('other', 'https://github.com/a/b.git', 'main'), gitRepo('mine', 'https://github.com/a/b.git', 'gh-pages')]
      );

      expect(plans[0]).toStrictEqual(expect.objectContaining({ name: 'mine', exists: true }));
    });

    it('should not match a git repository against a http repository with the same url', () => {
      const plans = planRepositories([{ name: 'a', url: 'https://a.io/charts' }], [gitRepo('git', 'https://a.io/charts')]);

      expect(plans[0].exists).toBe(false);
    });
  });

  describe('planExtensions', () => {
    const repoPlans = [
      {
        specName: 'repo-a', name: 'repo-a', url: 'https://a.io', isGit: false, exists: false, renamed: false
      },
      {
        specName: 'repo-b', name: 'repo-b-1', url: 'https://b.io', isGit: false, exists: false, renamed: true
      },
    ];

    const version = (v: string, appVersion?: string) => ({
      version: v, appVersion, repoType: 'cluster', repoName: 'repo-a'
    });

    const plugin = (name: string, repoName: string, versions: any[], extra = {}) => ({
      id:    `${ repoName }/${ name }`,
      name,
      label: `${ name } label`,
      chart: {
        chartName: name, repoName, repoType: 'cluster'
      },
      installableVersions: versions,
      installed:           false,
      ...extra,
    });

    it('should install an extension that is not installed', () => {
      const p = plugin('ext', 'repo-a', [version('2.0.0'), version('1.0.0')]);
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual({
        name:             'ext',
        label:            'ext label',
        action:           'install',
        plugin:           p,
        version:          p.installableVersions[0],
        installedVersion: undefined,
      });
    });

    it('should find an extension in a renamed repository', () => {
      const p = plugin('ext', 'repo-b-1', [version('1.0.0')]);
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan.plugin).toBe(p);
    });

    it('should not find an extension in a repository that is not in the install information', () => {
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [plugin('ext', 'other', [version('1.0.0')])]);

      expect(plan).toStrictEqual(expect.objectContaining({
        action: 'none', reason: 'notFound', label: 'ext'
      }));
    });

    it('should only look in the repository given for the extension', () => {
      const a = plugin('ext', 'repo-a', [version('1.0.0')]);
      const b = plugin('ext', 'repo-b-1', [version('1.0.0')]);
      const [plan] = planExtensions([{ name: 'ext', repository: 'repo-b' }], repoPlans, [a, b]);

      expect(plan.plugin).toBe(b);
    });

    it('should prefer repositories in the order they are listed', () => {
      const a = plugin('ext', 'repo-a', [version('1.0.0')]);
      const b = plugin('ext', 'repo-b-1', [version('1.0.0')]);
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [b, a]);

      expect(plan.plugin).toBe(a);
    });

    it('should not install an extension with no compatible versions', () => {
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [plugin('ext', 'repo-a', [])]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'noCompatibleVersion' }));
    });

    it('should upgrade an installed extension that is not the latest version', () => {
      const p = plugin('ext', 'repo-a', [version('2.0.0')], { installed: true, installedVersion: '1.0.0' });
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual(expect.objectContaining({
        action: 'upgrade', installedVersion: '1.0.0', version: p.installableVersions[0]
      }));
    });

    it('should compare the installed version with the app version', () => {
      const p = plugin('ext', 'repo-a', [version('3.0.0', '1.0.0')], { installed: true, installedVersion: '1.0.0' });
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installed' }));
    });

    it('should not install an extension that is already the latest version', () => {
      const p = plugin('ext', 'repo-a', [version('2.0.0')], { installed: true, installedVersion: '2.0.0' });
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installed' }));
    });

    it('should not install an extension that is installed with a newer version', () => {
      const p = plugin('ext', 'repo-a', [version('2.0.0')], { installed: true, installedVersion: '3.0.0' });
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installed' }));
    });

    it('should not upgrade when the installed version is not a valid version', () => {
      const p = plugin('ext', 'repo-a', [version('2.0.0')], { installed: true, installedVersion: 'dev' });
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installed' }));
    });

    it('should not install an extension that is installed from a different repository', () => {
      const installed = plugin('ext', 'other', [version('1.0.0')], { installed: true, installedVersion: '1.0.0' });
      const p = plugin('ext', 'repo-a', [version('2.0.0')]);
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [installed, p]);

      expect(plan).toStrictEqual(expect.objectContaining({
        action: 'none', reason: 'installedFromOtherRepo', installedVersion: '1.0.0'
      }));
    });

    it('should not install an extension that is installed and not from a repository', () => {
      const installed = {
        id: 'ext-1.0.0', name: 'ext', label: 'Ext', installed: true, installedVersion: '1.0.0'
      };
      const p = plugin('ext', 'repo-a', [version('2.0.0')]);
      const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [installed, p]);

      expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installedFromOtherRepo' }));
    });

    describe('with installed apps', () => {
      const installedApp = (chartVersion?: string, repoName?: string, appVersion?: string) => ({
        name: 'ext', chartVersion, appVersion, repoName
      });

      it('should upgrade an extension whose app is an older chart version', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('1.0.0', 'repo-a')]);

        expect(plan).toStrictEqual(expect.objectContaining({
          action: 'upgrade', installedVersion: '1.0.0', plugin: p
        }));
      });

      it('should report an extension whose app is the latest chart version as installed', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('2.0.0', 'repo-a')]);

        expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installed' }));
      });

      it('should show the app version as the installed version', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0', '0.5.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('2.0.0', 'repo-a', '0.5.0')]);

        expect(plan.installedVersion).toBe('0.5.0');
      });

      it('should report the extension as installed even if the page does not show it as installed', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0')], { installed: false });
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('2.0.0', 'repo-a')]);

        expect(plan.reason).toBe('installed');
      });

      it('should not install an extension whose app is from a different repository', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('1.0.0', 'other')]);

        expect(plan).toStrictEqual(expect.objectContaining({ action: 'none', reason: 'installedFromOtherRepo' }));
      });

      it('should use the extension from the repository the app was installed from', () => {
        const a = plugin('ext', 'repo-a', [version('2.0.0')]);
        const b = plugin('ext', 'repo-b-1', [version('2.0.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [a, b], [installedApp('1.0.0', 'repo-b-1')]);

        expect(plan.plugin).toBe(b);
      });

      it('should compare app versions if the app has no chart version', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0', '1.1.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp(undefined, 'repo-a', '1.0.0')]);

        expect(plan.action).toBe('upgrade');
      });

      it('should assume an app with no repository is from the same repository', () => {
        const p = plugin('ext', 'repo-a', [version('2.0.0')]);
        const [plan] = planExtensions([{ name: 'ext' }], repoPlans, [p], [installedApp('1.0.0')]);

        expect(plan.action).toBe('upgrade');
      });
    });

    it('should return a plan for each extension', () => {
      const plans = planExtensions([{ name: 'a' }, { name: 'b' }], repoPlans, [plugin('a', 'repo-a', [version('1.0.0')])]);

      expect(plans.map((p) => [p.name, p.action])).toStrictEqual([['a', 'install'], ['b', 'none']]);
    });
  });

  describe('toInstalledApp', () => {
    it('should use the source repository annotation', () => {
      const app = {
        metadata: { name: 'ext', labels: { 'catalog.cattle.io/cluster-repo-name': 'label-repo' } },
        spec:     {
          chart: {
            metadata: {
              version: '2.0.0', appVersion: '1.0.0', annotations: { 'catalog.cattle.io/ui-source-repo': 'annotation-repo' }
            }
          }
        },
      };

      expect(toInstalledApp(app)).toStrictEqual({
        name: 'ext', chartVersion: '2.0.0', appVersion: '1.0.0', repoName: 'annotation-repo'
      });
    });

    it('should fall back to the cluster repo label', () => {
      const app = { metadata: { name: 'ext', labels: { 'catalog.cattle.io/cluster-repo-name': 'label-repo' } } };

      expect(toInstalledApp(app)).toStrictEqual({
        name: 'ext', chartVersion: undefined, appVersion: undefined, repoName: 'label-repo'
      });
    });

    it('should handle a missing app', () => {
      expect(toInstalledApp(undefined)).toStrictEqual({
        name: undefined, chartVersion: undefined, appVersion: undefined, repoName: undefined
      });
    });
  });
});
