import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import { HCI } from '@shell/config/types';

export default {
  message() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {}).message ;
  },

  isReady() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {})?.status === 'True';
  },

  nics() {
    return this?.status?.nics || [];
  },

  attachNodeName() {
    return get(this, `metadata.labels."network.harvesterhci.io/nodename"`) || '';
  },

  linkMessage() {
    return {
      name:    this.attachNodeName,
      message: this.message,
      to:      `${ HCI.HOST }/${ this.attachNodeName }?mode=edit`
    };
  }
};
