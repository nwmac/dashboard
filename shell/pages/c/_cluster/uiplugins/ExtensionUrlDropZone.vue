<script setup lang="ts">
/**
 * Allows a URL to be dragged and dropped anywhere onto the window, while the Extensions page is shown, to install extensions.
 *
 * Shows an overlay while a URL is dragged over the window and emits `drop` with the URL when it is dropped.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { getDroppedUrl, isUrlDrag } from '@shell/utils/uiplugins-install-from-url';

const props = withDefaults(defineProps<{
  disabled?: boolean;
}>(), { disabled: false });

const emit = defineEmits<{(e: 'drop', url: string): void}>();

const store = useStore();
const { t } = useI18n(store);

// Nested elements fire their own dragenter/dragleave, so count entries and
// exits rather than toggling a boolean, otherwise the overlay flickers.
const dragDepth = ref(0);

// Drags that start in the app itself (e.g. dragging a link or image) should not be treated as a URL to install from
const internalDrag = ref(false);

const isDragging = computed(() => dragDepth.value > 0);

// Don't accept drops while a dialog is open
const canDrop = (event: DragEvent) => !props.disabled && !internalDrag.value && !store.state['action-menu']?.showModal && isUrlDrag(event.dataTransfer);

const onDragEnter = (event: DragEvent) => {
  if (canDrop(event)) {
    dragDepth.value++;
  }
};

const onDragOver = (event: DragEvent) => {
  if (canDrop(event)) {
    // Needed to allow the drop
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
};

const onDragLeave = () => {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
};

const onDrop = (event: DragEvent) => {
  dragDepth.value = 0;

  if (!canDrop(event)) {
    return;
  }

  // Stop the browser navigating to the dropped URL
  event.preventDefault();

  const url = getDroppedUrl(event.dataTransfer);

  if (url) {
    emit('drop', url);
  } else {
    store.dispatch('growl/error', {
      title:   t('plugins.installFromUrl.error.title'),
      message: t('plugins.installFromUrl.error.invalidUrl'),
      timeout: 5000,
    }, { root: true });
  }
};

const onDragStart = () => {
  internalDrag.value = true;
};

const onDragEnd = () => {
  internalDrag.value = false;
  dragDepth.value = 0;
};

const listeners: [string, (e: any) => void][] = [
  ['dragenter', onDragEnter],
  ['dragover', onDragOver],
  ['dragleave', onDragLeave],
  ['drop', onDrop],
  ['dragstart', onDragStart],
  ['dragend', onDragEnd],
];

onMounted(() => {
  listeners.forEach(([name, fn]) => document.addEventListener(name, fn));
});

onBeforeUnmount(() => {
  listeners.forEach(([name, fn]) => document.removeEventListener(name, fn));
});
</script>

<template>
  <div
    v-if="isDragging"
    class="extension-url-drop-overlay"
    data-testid="extensions-url-drop-overlay"
  >
    <div class="drop-message">
      <i class="icon icon-extension" />
      <div class="drop-title">
        {{ t('plugins.installFromUrl.drop.title') }}
      </div>
      <div class="drop-subtitle">
        {{ t('plugins.installFromUrl.drop.subtitle') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.extension-url-drop-overlay {
  position: fixed;
  inset: 0;
  z-index: z-index('modalOverlay');
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed var(--primary);
  backdrop-filter: blur(2px);
  color: var(--on-tertiary-hover, var(--link));
  // Let the drag events reach the document rather than stopping at the overlay
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--tertiary-hover);
    opacity: 0.9;
  }

  .drop-message {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    text-align: center;

    .icon {
      font-size: 64px;
    }

    .drop-title {
      font-size: 20px;
      font-weight: 600;
    }

    .drop-subtitle {
      font-size: 14px;
    }
  }
}
</style>
