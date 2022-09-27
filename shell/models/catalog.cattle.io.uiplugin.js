import SteveModel from '@shell/plugins/steve/steve-class';

const CACHED_STATUS = 'cached';

export default class UIPlugin extends SteveModel {
  get name() {
    return this.spec?.plugin?.name;
  }

  get description() {
    return this.spec?.plugin?.description;
  }

  get version() {
    return this.spec?.plugin?.version;
  }

  get willBeCached() {
    return this.spec?.plugin?.noCache === false;
  }

  // Has the plugin been cached?
  get isCached() {
    return !this.willBeCached || (this.willBeCached && this.status?.cacheState === CACHED_STATUS);
  }
}
