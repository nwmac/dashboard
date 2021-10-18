import { _VIEW } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

export default {
  showMasthead() {
    return (mode) => {
      return mode === _VIEW;
    };
  },

  applyDefaults() {
    return () => {
      if ( !this.charts ) {
        set(this, 'charts', [
          {}
        ]);
      }
    };
  },
};
