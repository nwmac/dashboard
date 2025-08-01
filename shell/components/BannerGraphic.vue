<script>
import Closeable from '@shell/mixins/closeable';
import BrandImage from '@shell/components/BrandImage';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  components: { BrandImage },
  mixins:     [Closeable],

  props: {
    title: {
      type:    String,
      default: null,
    },
    titleKey: {
      type:    String,
      default: null,
    },

    small: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const managementSettings = this.$store.getters['management/all'](MANAGEMENT.SETTING);

    return { managementSettings };
  },

  computed: {
    center() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.UI_BRANDING_CONFIG)[0] || {};

      if (setting.value) {
        try {
          const data = JSON.parse(setting.value || '{}');

          return data?.center || false;
        } catch (e) {
          console.error('Could not parse UI Banner Configuration setting', e); // eslint-disable-line no-console
        }
      }

      return false;
    }
  }
};
</script>

<template>
  <div
    v-if="shown"
    class="banner-graphic"
    :class="{'small': small}"
  >
    <div class="graphic">
      <BrandImage
        class="banner"
        data-testid="banner-brand__img"
        file-name="banner.svg"
        :draggable="false"
        :alt="t('landing.bannerImage')"
      />
    </div>
    <div
      v-if="titleKey"
      data-testid="banner-title-key"
      class="title"
      :class="{'title-center': center }"
    >
      <t :k="titleKey" />
    </div>
    <h1
      v-else-if="title"
      v-clean-html="title"
      data-testid="banner-title"
      class="title"
      :class="{'title-center': center }"
    />
  </div>
</template>

<style lang="scss">
  $banner-height: 240px;
  $banner-height-small: 200px;

  .banner-graphic {
    position: relative;

    .graphic {
      display: flex;
      flex-direction: column;
      height: $banner-height;
      overflow: hidden;
      > img.banner {
        flex: 1;
        object-fit: cover;
      }
    }
    .title {
      align-items: center;
      display: flex;
      position: absolute;
      top: 0;
      height: 100%;
      width: 100%;
      padding-left: 20px;

      &.title-center {
        justify-content: center;
        text-align: center;
        padding-left: 0;
      }
    }
    &.small {
      .graphic {
        height: $banner-height-small;
        img.banner {
          margin-top: math.div(($banner-height-small - $banner-height), 2);
        }
      }
    }
  }
</style>
