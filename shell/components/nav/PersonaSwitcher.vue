<script setup lang="ts">
/**
 * The top of the side nav: the persona's avatar and, when the nav is expanded, a persona switcher.
 *
 * The avatar (with a small burger badge) is always the nav's menu button and never moves. Expanded,
 * the product and persona names beside it open a menu to switch persona. Cmd-clicking the avatar opens
 * that menu instead, without expanding the nav.
 */
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { usePersona } from '@shell/composables/usePersona';
import { getVendor } from '@shell/config/private-label';
import { RcDropdown, RcDropdownTrigger, RcDropdownItemRadio } from '@components/RcDropdown';

const props = defineProps<{
  /** Whether the side nav is expanded */
  expanded: boolean;
}>();

const emit = defineEmits(['toggle', 'close']);

const store = useStore();
const { t } = useI18n(store);
const { personas, activePersona, setPersona } = usePersona();

const vendor = getVendor();
const menuOpen = ref(false);

// The menu is centred under the expanded nav's whole row, not just the names, so it has the nav's
// full width to fit in. The anchor keeps that width when the nav is collapsed, so the menu opens (and
// closes) in the same place either way
const anchor = ref<HTMLElement | null>(null);
const anchorNode = () => anchor.value;

// Collapsing the nav takes the trigger with it, so the menu goes too
watch(() => props.expanded, () => {
  menuOpen.value = false;
});

const onToggleClick = (e: MouseEvent) => {
  if (e.metaKey) {
    menuOpen.value = !menuOpen.value;

    return;
  }

  emit('toggle');
};

const choose = (id: string) => {
  setPersona(id);
  menuOpen.value = false;
  emit('close');
};
</script>

<template>
  <div class="persona-switcher">
    <div
      ref="anchor"
      class="persona-menu-anchor"
      aria-hidden="true"
    />
    <div
      data-testid="top-level-menu"
      :aria-label="expanded ? t('nav.collapseAppBar') : t('nav.expandAppBar')"
      :aria-expanded="expanded"
      aria-controls="top-level-menu-body"
      role="button"
      tabindex="0"
      class="persona-toggle"
      @keyup.enter="emit('toggle')"
      @keyup.space="emit('toggle')"
      @click="onToggleClick"
    >
      <span
        class="persona-avatar"
        :style="{ backgroundColor: activePersona.color }"
      >
        <i :class="['icon', `icon-${ activePersona.icon }`]" />
        <span
          class="persona-menu-badge"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          ><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
        </span>
      </span>
    </div>

    <!-- Fixed, as the collapsed nav would otherwise clip the menu opened from the avatar -->
    <rc-dropdown
      v-model:open="menuOpen"
      placement="bottom"
      :distance="4"
      strategy="fixed"
      :reference-node="anchorNode"
      :aria-label="t('persona.switcher.menu')"
    >
      <rc-dropdown-trigger
        v-if="expanded"
        variant="ghost"
        class="persona-trigger"
        data-testid="persona-switcher-trigger"
        :aria-label="t('persona.switcher.trigger', { persona: t(activePersona.labelKey) })"
      >
        <span class="persona-name">
          <span class="persona-caption">{{ vendor }}</span>
          <span class="persona-label">{{ t(activePersona.labelKey) }}</span>
        </span>
        <i class="icon icon-chevron-down persona-chevron" />
      </rc-dropdown-trigger>

      <template #dropdownCollection>
        <rc-dropdown-item-radio
          v-for="persona in personas"
          :key="persona.id"
          :checked="persona.id === activePersona.id"
          :data-testid="`persona-option-${ persona.id }`"
          @click="choose(persona.id)"
        >
          <template #before>
            <span
              class="persona-avatar small"
              :style="{ backgroundColor: persona.color }"
            >
              <i :class="['icon', `icon-${ persona.icon }`]" />
            </span>
          </template>
          <span class="persona-option">
            <span class="persona-option-label">{{ t(persona.labelKey) }}</span>
            <span class="persona-option-description">{{ t(persona.descriptionKey) }}</span>
          </span>
        </rc-dropdown-item-radio>
      </template>
    </rc-dropdown>
  </div>
</template>

<style lang="scss" scoped>
  .persona-switcher {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .persona-menu-anchor {
    position: absolute;
    top: 0;
    left: 0;
    width: $app-bar-expanded-width;
    height: 100%;
    visibility: hidden;
    pointer-events: none;
  }

  .persona-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $app-bar-collapsed-width;
    height: 100%;
    flex: 0 0 $app-bar-collapsed-width;
    cursor: pointer;

    &:focus-visible {
      outline: none;

      .persona-avatar {
        @include focus-outline;
        outline-offset: 4px;
      }
    }
  }

  .persona-avatar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #fff;

    > .icon {
      font-size: 20px;
    }

    &.small {
      width: 28px;
      height: 28px;
      border-radius: 6px;

      > .icon {
        font-size: 16px;
      }
    }
  }

  // Three small lines at the avatar's corner, so it still reads as the menu button
  .persona-menu-badge {
    position: absolute;
    right: -6px;
    bottom: -6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--topmenu-bg);
    border: 1px solid var(--topmost-border);

    svg {
      width: 12px;
      height: 12px;
      fill: var(--header-btn-text);
    }
  }

  // RcDropdown's wrapper around the trigger fills the rest of the row
  .persona-switcher > :deep(.v-popper) {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100%;
    align-items: center;
  }

  .persona-trigger {
    display: flex;
    align-items: center;
    width: 100%;
    height: 44px;
    margin-right: 8px;
    padding: 0 12px 0 8px;
    border-radius: var(--border-radius);
    text-align: left;

    // As the nav's rows: a flat fill on hover, and the text never changes colour
    &, &:hover, &:focus, &[aria-expanded="true"] {
      color: var(--body-text);
    }

    &:hover, &[aria-expanded="true"] {
      background-color: var(--nav-hover-top-level, var(--primary-hover-bg));
    }

    &:focus-visible {
      outline-offset: -2px;
    }
  }

  // The nav clips anything wider than itself, so the menu keeps within its width
  .persona-switcher :deep(.dropdownTarget) {
    width: calc(#{$app-bar-expanded-width} - 16px);
    box-sizing: border-box;
  }

  .persona-name {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    line-height: 1.2;
    white-space: nowrap;
  }

  .persona-caption {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
  }

  .persona-label {
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .persona-chevron {
    flex: 0 0 auto;
    margin-left: 8px;
    color: var(--muted);
  }

  .persona-option {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }

  // Each held to one line, so every option is the same height
  .persona-option-label, .persona-option-description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .persona-option-label {
    font-weight: 600;
  }

  .persona-option-description {
    font-size: 12px;
    color: var(--muted);
  }
</style>
