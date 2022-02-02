<script>
import { mapGetters } from 'vuex';
import { CLUSTER_BADGE } from '@/config/labels-annotations';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { exceptionToErrorsArray } from '@/utils/error';
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import ColorInput from '@/components/form/ColorInput';
import { parseColor, textColor } from '@/utils/color';

export default {
  name:       'AddCustomBadgeDialog',
  components: {
    Card,
    AsyncButton,
    Banner,
    Checkbox,
    LabeledInput,
    ColorInput,
  },

  data() {
    return {
      useCustomBadge:         true,
      errors:           [],
      badgeBgColor:     '',
      badgeDescription: '',
      badgeAsIcon:      false,
    };
  },

  fetch() {
    if (this.currentCluster.metadata?.annotations) {
      this.badgeDescription = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.TEXT] || 'Example Text';
      this.badgeBgColor = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.COLOR] || '#ff0000';
      this.badgeAsIcon = this.currentCluster.metadata?.annotations[CLUSTER_BADGE.USE_AS_ICON] || false;
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),

    previewColor() {
      return textColor(parseColor(this.badgeBgColor)) || 'white';
    },
    canSubmit() {
      return !this.badgeDescription.length >= 1;
    }
  },

  methods:  {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        const options = {
          [CLUSTER_BADGE.TEXT]:        this.badgeDescription,
          [CLUSTER_BADGE.COLOR]:       this.badgeBgColor,
          [CLUSTER_BADGE.USE_AS_ICON]: this.badgeAsIcon,
        };

        await this.currentCluster.setBadge(options, this.useCustomBadge);

        buttonDone(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card class="prompt-badge" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text">
      {{ t('clusterBadge.modal.title') }}
    </h4>

    <div slot="body" class="pl-10 pr-10 cluster-badge-body">
      <div class="row mt-10">
        <div class="col">
          <Checkbox
            v-model="useCustomBadge"
            :label="t('clusterBadge.modal.checkbox')"
            class="mt-10"
          />
        </div>

        <div v-if="useCustomBadge" class="col">
          <div class="badge-preview">
            <div
              v-if="badgeAsIcon"
              class="cluster-badge-icon-preview"
              :style="{
                backgroundColor: badgeBgColor,
                color: previewColor
              }"
            >
              {{ badgeDescription.substr(0, 1).toUpperCase() }}
            </div>

            <div
              :style="{
                backgroundColor: badgeBgColor,
                color: previewColor
              }"
              class="cluster-badge-preview ml-5"
            >
              {{ badgeDescription }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="useCustomBadge" class="options">
        <div class="row mt-20">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="badgeDescription"
              :label="t('clusterBadge.modal.description')"
              :maxlength="32"
              :required="true"
            />
          </div>
        </div>

        <div class="row mt-20">
          <div class="col span-12">
            <ColorInput
              v-model="badgeBgColor"
              :default-value="badgeBgColor"
              :label="t('clusterBadge.modal.badgeBgColor')"
            />
          </div>
        </div>

        <Checkbox
          v-model="badgeAsIcon"
          :label="t('clusterBadge.modal.badgeAsIcon')"
          class="mt-10"
        />
      </div>
    </div>

    <div slot="actions" class="bottom">
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton :action-label="t('clusterBadge.modal.buttonAction')" :disabled="canSubmit" @click="apply" />
      </div>
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-badge {
    margin: 0;

    .cluster-badge-body {
      min-height: 50px;
      display: flex;
      flex-direction: column;

      .badge-preview {
        align-items: center;
        display: flex;
        height: 32px;
        white-space: nowrap;

        .cluster-badge-icon-preview {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          font-weight: bold;
        }

        .cluster-badge-preview {
          cursor: default;
          border-radius: 10px;
          font-size: 12px;
          padding: 2px 10px;
        }
      }
    }
  }

  .bottom {
    display: flex;
    flex-direction: column;
    flex: 1;

    .banner {
      margin-top: 0;
    }

    .buttons {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  }

</style>
