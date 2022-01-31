<script>
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { exceptionToErrorsArray } from '@/utils/error';
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import ColorInput from '@/components/form/ColorInput';

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
  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      useBadge:         true,
      badgeTextColor:   '#ffffff',
      badgeBgColor:     '#ff0000',
      badgeDescription: 'Example Text',
      badgeAsIcon:      true,
      errors:           [],
    };
  },
  computed: {
    cluster() {
      return this.resources[0];
    },
  },

  methods:  {
    close() {
      this.$emit('close');
    },

    apply(buttonDone) {
      // apply to cluster annotations
      try {
        const data = {
          text:       this.badgeDescription,
          color:      this.badgeBgColor,
          textColor:  this.badgeTextColor,
          useForIcon: this.badgeAsIcon,
        };

        console.log(data);

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
        <div class="col span-6">
          <Checkbox
            v-model="useBadge"
            :label="t('clusterBadge.modal.checkbox')"
            class="mt-10 type"
          />
        </div>
        <div class="col span-6">
          <div v-if="useBadge" class="mt-10 badge-preview">
            <p>Preview:</p>
            <div
              v-if="useBadge"
              :style="{ backgroundColor: badgeBgColor, color: badgeTextColor }"
              class="cluster-badge ml-5"
            >
              {{ badgeDescription }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="useBadge" class="options ">
        <div class="row mt-20">
          <div class="col span-12">
            <LabeledInput
              v-model.trim="badgeDescription"
              :label="t('clusterBadge.modal.description')"
              :maxlength="32"
            />
          </div>
        </div>

        <div class="row mt-20">
          <div class="col span-6">
            <ColorInput
              v-model="badgeTextColor"
              :default-value="badgeTextColor"
              :label="t('clusterBadge.modal.badgeTextColor')"
            />
          </div>
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
          class="mt-10 type"
        />
      </div>
    </div>

    <div slot="actions" class="bottom">
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          :action-label="t('clusterBadge.modal.buttonAction')"
          @click="apply"
        />
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
      display: flex;

      .cluster-badge {
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
    margin-top: 0
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}

</style>
