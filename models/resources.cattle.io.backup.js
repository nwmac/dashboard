import { colorForState, stateDisplay } from '@shell/plugins/steve/resource-instance';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

export default {
  readyMessage() {
    const conditions = get(this, 'status.conditions');
    const readyMessage = (findBy(conditions, 'type', 'Ready') || {}).message ;

    return readyMessage;
  },
  colorForState() {
    if (this.readyMessage) {
      return colorForState(this.readyMessage);
    }

    return colorForState();
  },

  stateDisplay() {
    if (this.readyMessage) {
      return stateDisplay(this.readyMessage);
    }

    return stateDisplay();
  }

};
