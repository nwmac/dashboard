import { MODE, _EDIT } from '@shell/config/query-params';
import NormanModel from '@shell/plugins/steve/norman-class';

export default class App extends NormanModel {
  get appEditUrl() {
    return this.detailLocation;
  }

  goToEdit(moreQuery = {}) {
    const location = this.appEditUrl;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }
}
