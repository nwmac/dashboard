<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import { mapGetters } from 'vuex';
import PersistentVolumeClaim from '@/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim';
import { PVC } from '@/config/types';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    PersistentVolumeClaim,
    Checkbox
  },

  props:      {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    String,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // array of existing persistent volume claims
    pvcs: {
      type:    Array,
      default: () => []
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },
  },

  async fetch() {
    const namespace = this.namespace || this.$store.getters['defaultNamespace'];

    const data = { type: PVC };

    data.metadata = { namespace };

    const pvc = await this.$store.dispatch('cluster/create', data);

    pvc.applyDefaults();

    this.pvc = pvc;
  },

  data() {
    return { pvc: null };
  },

  computed: {
    // whether this is creating a new PVC or referencing an existing one
    createNew() {
      return this.value._type === 'createPVC';
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    namespace(neu) {
      this.pvc.metadata.namespace = neu;
    },

    'pvc.metadata.name'(neu) {
      this.value.persistentVolumeClaim.claimName = neu;
    }
  }
};
</script>

<template>
  <div>
    <div>
      <div v-if="createNew" class="bordered-section">
        <PersistentVolumeClaim v-if="pvc" v-model="pvc" :register-before-hook="registerBeforeHook" :mode="mode" />
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.name" :required="true" :mode="mode" :label="t('workload.storage.volumeName')" />
        </div>
        <div class="col span-6">
          <LabeledSelect v-if="!createNew" v-model="value.persistentVolumeClaim.claimName" :mode="mode" :label="t('workload.storage.subtypes.persistentVolumeClaim')" :options="pvcs" />
          <LabeledInput v-else-if="pvc" :mode="mode" disabled :label="t('workload.storage.subtypes.persistentVolumeClaim')" :value="pvc.metadata.name" />
        </div>
      </div>
      <div class="row">
        <Checkbox v-model="value.persistentVolumeClaim.readOnly" :mode="mode" :label="t('workload.storage.readOnly')" />
      </div>
    </div>
  </div>
</template>
