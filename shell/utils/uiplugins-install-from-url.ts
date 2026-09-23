import jsyaml from 'js-yaml';
import { isChartVersionHigher } from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

/**
 * Helpers for installing extensions from a URL that is dropped onto the Extensions page.
 *
 * The URL points at a page (typically a GitHub README) containing a `<details>` element with a YAML block such as:
 *
 * ```yaml
 * type: rancher-ui-extension-install
 * repositories:
 *   - name: my-repo
 *     url: https://example.github.io/my-repo
 * extensions:
 *   - my-extension
 * ```
 */

export const INSTALL_SPEC_TYPE = 'rancher-ui-extension-install';

export interface InstallSpecRepository {
  name: string;
  url: string;
  branch?: string;
}

export interface InstallSpecExtension {
  name: string;
  /**
   * Optional name of the repository (as named in the spec) that the extension should be installed from
   */
  repository?: string;
}

export interface InstallSpec {
  repositories: InstallSpecRepository[];
  extensions: InstallSpecExtension[];
}

export interface RepoPlan {
  /**
   * Name of the repository in the install spec
   */
  specName: string;
  /**
   * Name of the cluster repository that will be (or already is) used
   */
  name: string;
  url: string;
  branch?: string;
  isGit: boolean;
  /**
   * True if a cluster repository with the same URL already exists
   */
  exists: boolean;
  /**
   * True if the name in the spec was already used by a different repository, so a different name was chosen
   */
  renamed: boolean;
}

export type ExtensionAction = 'install' | 'upgrade' | 'none';

export type ExtensionUnavailableReason = 'installed' | 'notFound' | 'noCompatibleVersion' | 'installedFromOtherRepo';

export interface ExtensionPlan {
  name: string;
  label: string;
  action: ExtensionAction;
  reason?: ExtensionUnavailableReason;
  /**
   * The extension item (as used on the Extensions page) to install
   */
  plugin?: any;
  /**
   * The chart version to install - always the latest installable version
   */
  version?: any;
  installedVersion?: string;
}

export class InstallSpecError extends Error {
  key: string;

  constructor(key: string, message?: string) {
    super(message || key);
    this.key = key;
  }
}

const HTTP_URL_REGEX = /^https?:\/\//i;

/**
 * Is the given string a http(s) URL?
 */
export function isHttpUrl(value?: string): boolean {
  if (!value || !HTTP_URL_REGEX.test(value.trim())) {
    return false;
  }

  try {
    new URL(value.trim()); // eslint-disable-line no-new

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Is something that looks like it could be a URL being dragged?
 *
 * Note: the dragged data can not be read until it is dropped, so we can only check the types
 */
export function isUrlDrag(dataTransfer?: DataTransfer | null): boolean {
  const types = Array.from(dataTransfer?.types || []);

  return !types.includes('Files') && (types.includes('text/uri-list') || types.includes('text/plain'));
}

/**
 * Get the URL that was dropped, if any
 */
export function getDroppedUrl(dataTransfer?: DataTransfer | null): string | undefined {
  if (!dataTransfer) {
    return undefined;
  }

  // text/uri-list can contain comments (lines starting with #) and multiple URLs - use the first
  const uriList = (dataTransfer.getData('text/uri-list') || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const candidates = [...uriList, (dataTransfer.getData('text/plain') || '').trim()];

  return candidates.find((c) => isHttpUrl(c));
}

/**
 * Get the URLs to try and fetch the install information from, for the given URL.
 *
 * GitHub pages can't be fetched from the browser (no CORS headers), so GitHub repository and file URLs are
 * mapped to the equivalent raw content URLs
 */
export function getFetchUrls(url: string): string[] {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch (e) {
    return [url];
  }

  const host = parsed.hostname.toLowerCase();

  if (host !== 'github.com' && host !== 'www.github.com') {
    return [url];
  }

  const [owner, rawRepo, kind, ref, ...rest] = parsed.pathname.split('/').filter((p) => !!p);

  if (!owner || !rawRepo) {
    return [url];
  }

  const repo = rawRepo.replace(/\.git$/, '');
  const raw = `https://raw.githubusercontent.com/${ owner }/${ repo }`;

  if (kind === 'blob' && ref && rest.length) {
    return [`${ raw }/${ ref }/${ rest.join('/') }`];
  }

  if (kind === 'tree' && ref) {
    const folder = rest.length ? `${ rest.join('/') }/` : '';

    return [`${ raw }/${ ref }/${ folder }README.md`, `${ raw }/${ ref }/${ folder }readme.md`];
  }

  if (!kind) {
    return [`${ raw }/HEAD/README.md`, `${ raw }/HEAD/readme.md`];
  }

  return [url];
}

const HTML_ENTITIES: Record<string, string> = {
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&#39;':  '\'',
  '&#x27;': '\'',
  '&nbsp;': ' ',
  '&amp;':  '&',
};

function decodeHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(lt|gt|quot|#39|#x27|nbsp|amp);/g, (m) => HTML_ENTITIES[m]);
}

/**
 * Find the YAML blocks in the given markdown or HTML content
 */
function findYamlBlocks(content: string): string[] {
  const blocks: string[] = [];

  // Markdown fenced code blocks
  for (const match of content.matchAll(/```[ \t]*ya?ml[^\n]*\n([\s\S]*?)```/gi)) {
    blocks.push(match[1]);
  }

  // HTML pre blocks (e.g. rendered markdown)
  for (const match of content.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)) {
    blocks.push(decodeHtml(match[1]));
  }

  return blocks;
}

/**
 * Parse and validate an install spec object
 */
export function validateInstallSpec(data: any): InstallSpec {
  if (!data || typeof data !== 'object' || data.type !== INSTALL_SPEC_TYPE) {
    throw new InstallSpecError('plugins.installFromUrl.error.notFound');
  }

  const repositories = Array.isArray(data.repositories) ? data.repositories : [];
  const extensions = Array.isArray(data.extensions) ? data.extensions : [];

  const repos: InstallSpecRepository[] = repositories.map((r: any) => {
    if (!r || typeof r.name !== 'string' || !r.name.trim() || !isHttpUrl(r.url)) {
      throw new InstallSpecError('plugins.installFromUrl.error.invalidRepo');
    }

    const repo: InstallSpecRepository = { name: r.name.trim(), url: r.url.trim() };

    if (typeof r.branch === 'string' && r.branch.trim()) {
      repo.branch = r.branch.trim();
    }

    return repo;
  });

  const exts: InstallSpecExtension[] = extensions.map((e: any) => {
    if (typeof e === 'string' && e.trim()) {
      return { name: e.trim() };
    }

    if (e && typeof e.name === 'string' && e.name.trim()) {
      const ext: InstallSpecExtension = { name: e.name.trim() };

      if (typeof e.repository === 'string' && e.repository.trim()) {
        ext.repository = e.repository.trim();
      }

      return ext;
    }

    throw new InstallSpecError('plugins.installFromUrl.error.invalidExtension');
  });

  if (!exts.length) {
    throw new InstallSpecError('plugins.installFromUrl.error.noExtensions');
  }

  return { repositories: repos, extensions: exts };
}

function tryLoadYaml(text: string): any {
  try {
    return jsyaml.load(text);
  } catch (e) {
    return undefined;
  }
}

/**
 * Parse the install spec from the given content.
 *
 * Looks for a YAML block in a `<details>` element (markdown or HTML). Content that is YAML itself is also accepted.
 */
export function parseInstallSpec(content: string): InstallSpec {
  const details = content.match(/<details[\s>][\s\S]*?<\/details>/gi) || [];

  for (const section of details) {
    for (const block of findYamlBlocks(section)) {
      const data = tryLoadYaml(block);

      if (data?.type === INSTALL_SPEC_TYPE) {
        return validateInstallSpec(data);
      }
    }
  }

  // Fallback - the content might be the YAML itself
  const data = tryLoadYaml(content);

  if (data?.type === INSTALL_SPEC_TYPE) {
    return validateInstallSpec(data);
  }

  throw new InstallSpecError('plugins.installFromUrl.error.notFound');
}

/**
 * Normalize a repository URL so that equivalent URLs can be compared
 */
export function normalizeRepoUrl(url?: string): string {
  return (url || '').trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
}

function isGitRepo(repo: InstallSpecRepository): boolean {
  if (repo.branch || /\.git\/?$/i.test(repo.url)) {
    return true;
  }

  try {
    const host = new URL(repo.url).hostname.toLowerCase();

    return host === 'github.com' || host === 'www.github.com';
  } catch (e) {
    return false;
  }
}

/**
 * Convert a name into a valid Kubernetes resource name
 */
function toResourceName(name: string): string {
  const out = name.toLowerCase().replace(/[^a-z0-9-.]/g, '-').replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');

  return out || 'extensions';
}

/**
 * Work out which repositories need to be added.
 *
 * Repositories that already exist (same URL, and branch for git repositories) are re-used. If the name of a repository
 * that needs adding is already used, a number is appended to the name to make it unique.
 */
export function planRepositories(specRepos: InstallSpecRepository[], existingRepos: any[]): RepoPlan[] {
  const usedNames = new Set<string>(existingRepos.map((r) => r.metadata?.name).filter((n) => !!n));

  return specRepos.map((specRepo) => {
    const isGit = isGitRepo(specRepo);
    const url = normalizeRepoUrl(specRepo.url);

    const existing = existingRepos.find((r) => {
      if (isGit) {
        return normalizeRepoUrl(r.spec?.gitRepo) === url && (!specRepo.branch || r.spec?.gitBranch === specRepo.branch);
      }

      return !r.spec?.gitRepo && normalizeRepoUrl(r.spec?.url) === url;
    });

    const plan: RepoPlan = {
      specName: specRepo.name,
      name:     existing?.metadata?.name,
      url:      specRepo.url,
      branch:   specRepo.branch,
      isGit,
      exists:   !!existing,
      renamed:  false,
    };

    if (!existing) {
      const base = toResourceName(specRepo.name);
      let name = base;
      let count = 1;

      while (usedNames.has(name)) {
        name = `${ base }-${ count++ }`;
      }

      usedNames.add(name);
      plan.name = name;
      plan.renamed = name !== specRepo.name;
    }

    return plan;
  });
}

function isVersionHigher(a?: string, b?: string): boolean {
  if (!a || !b) {
    return false;
  }

  try {
    return isChartVersionHigher(a, b);
  } catch (e) {
    return false;
  }
}

/**
 * Summary of an extension that has been installed (as a Helm app)
 */
export interface InstalledApp {
  name: string;
  chartVersion?: string;
  appVersion?: string;
  /**
   * Name of the repository that the extension was installed from
   */
  repoName?: string;
}

/**
 * Get the installed extension information from a Helm app in the extensions namespace
 */
export function toInstalledApp(app: any): InstalledApp {
  const chart = app?.spec?.chart?.metadata || {};

  return {
    name:         app?.metadata?.name,
    chartVersion: chart.version,
    appVersion:   chart.appVersion,
    repoName:     chart.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] || app?.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME],
  };
}

/**
 * Work out what needs to be done for each of the extensions in the install spec
 *
 * @param extensions the extensions from the install spec
 * @param repoPlans the repositories the extensions come from
 * @param plugins the extension items, as shown on the Extensions page
 * @param apps the extensions that are installed as Helm apps
 */
export function planExtensions(extensions: InstallSpecExtension[], repoPlans: RepoPlan[], plugins: any[], apps: InstalledApp[] = []): ExtensionPlan[] {
  return extensions.map((ext) => {
    const repoNames = (ext.repository ? repoPlans.filter((r) => r.specName === ext.repository) : repoPlans).map((r) => r.name);

    const candidates = plugins
      .filter((p) => p.name === ext.name && p.chart && repoNames.includes(p.chart.repoName))
      .sort((a, b) => repoNames.indexOf(a.chart.repoName) - repoNames.indexOf(b.chart.repoName));

    const app = apps.find((a) => a.name === ext.name);
    const installedPlugin = plugins.find((p) => p.name === ext.name && p.installed);
    const installedCandidate = installedPlugin && candidates.includes(installedPlugin) ? installedPlugin : undefined;
    const appCandidate = app?.repoName ? candidates.find((p) => p.chart.repoName === app.repoName) : undefined;
    const plugin = appCandidate || installedCandidate || candidates.find((p) => p.installableVersions?.length) || candidates[0];

    const plan: ExtensionPlan = {
      name:             ext.name,
      label:            plugin?.label || installedPlugin?.label || ext.name,
      action:           'none',
      plugin,
      installedVersion: app ? (app.appVersion || app.chartVersion) : installedPlugin?.installedVersion,
    };

    if (!plugin) {
      plan.reason = 'notFound';

      return plan;
    }

    const version = plugin.installableVersions?.[0];

    if (!version) {
      plan.reason = 'noCompatibleVersion';

      return plan;
    }

    plan.version = version;

    if (app) {
      // Installed from a different repository - the user needs to uninstall it first (same as the Extensions page)
      if (app.repoName && !repoNames.includes(app.repoName)) {
        plan.reason = 'installedFromOtherRepo';
      } else if (app.chartVersion ? isVersionHigher(version.version, app.chartVersion) : isVersionHigher(version.appVersion ?? version.version, app.appVersion)) {
        plan.action = 'upgrade';
      } else {
        plan.reason = 'installed';
      }

      return plan;
    }

    if (!installedPlugin) {
      plan.action = 'install';

      return plan;
    }

    // Loaded without a Helm app (e.g. developer load), or installed from a different repository
    if (!installedCandidate) {
      plan.reason = 'installedFromOtherRepo';

      return plan;
    }

    // The installed version reported by the extension is the app version, if the chart has one
    const latest = version.appVersion ?? version.version;

    if (isVersionHigher(latest, installedPlugin.installedVersion)) {
      plan.action = 'upgrade';
    } else {
      plan.reason = 'installed';
    }

    return plan;
  });
}
