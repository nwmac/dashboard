<script>
import { KEY } from '@shell/utils/platform';
import { LabeledInput } from '@components/Form/LabeledInput';
import ColorInput from '@shell/components/form/ColorInput';

const HEADER_HEIGHT = 55;

export default {
  props: {
    catalog: {
      type:     Array,
      required: true
    },    
  },

  components: {
    ColorInput,
    LabeledInput,
  },

  data() {
    console.log(this.catalog);

    return {
      isOpen:         false,
      definition:     undefined,
      busy:           true,
      error:          false,
      expandAll:      false,
      isResizing:     false,
      resizeLeft:     '',
      resizePosition: 'absolute',
      width:          '33%',
      right:          '-33%',
      breadcrumbs:    undefined,
      definitions:    {},
      noResource:     false,
      notFound:       false,
      id:             '',
      properties:     [],
    };
  },

  computed: {
    top() {
      const banner = document.getElementById('banner-header');
      //let height = HEADER_HEIGHT;
      let height = 0;

      if (banner) {
        height += banner.clientHeight;
      }

      return `${ height }px`;
    },

    height() {
      return `calc(100vh - ${ this.top })`;
    }
  },

  methods: {
    open(id, definition, values) {

      if (id) {
        this.id = id;

        const props = [];
        definition.forEach((p) => {
          props.push({
            ... p,
            value: values[p.name] = values[p.name] || '',
          });
        });

        this.properties = props;

        console.error(this.properties);
      } else {
        this.properties.id = '',
        this.properties.definition = [];
        this.properties.values = {};
      }

      this.busy = true;
      this.isOpen = true;
      this.addCloseKeyHandler();
      this.right = '0';
    },

    saveProperties() {
      this.close();
    },

    discardProperties() {
      this.id = '';
      this.properties = {};
      this.close();
    },

    close() {
      this.isOpen = false;
      this.removeCloseKeyHandler();
      this.right = `-${ this.width }`;

      this.$emit('closed', this.id, this.properties);
    },

    scrollTop() {
      this.$refs.main.$el.scrollTop = 0;
    },

    addCloseKeyHandler() {
      document.addEventListener('keyup', this.closeKeyHandler);
    },

    removeCloseKeyHandler() {
      document.removeEventListener('keyup', this.closeKeyHandler);
    },

    closeKeyHandler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.close();
      }
    },

    toggleAll() {
      this.expandAll = !this.expandAll;
    },

    startPanelResize(ev) {
      this.isResizing = true;
      this.$refs.resizer.setPointerCapture(ev.pointerId);
    },

    doPanelResize(ev) {
      if (this.isResizing) {
        this.resizePosition = 'fixed';
        this.resizeLeft = `${ ev.clientX }px`;
      }
    },

    endPanelResize(ev) {
      this.isResizing = false;
      this.$refs.resizer.releasePointerCapture(ev.pointerId);

      const width = window.innerWidth - ev.clientX + 2;

      this.resizePosition = 'absolute';
      this.resizeLeft = '';

      this.width = `${ width }px`;
    },

    navigate(breadcrumbs) {
      const goto = breadcrumbs[breadcrumbs.length - 1];

      this.breadcrumbs = breadcrumbs;
      this.definition = this.definitions[goto.id];
      this.expanded = {};
      this.expandAll = false;
      this.notFound = false;

      if (!this.definition) {
        this.noResource = true;
        this.notFound = true;

        return;
      }

      expandOpenAPIDefinition(this.definitions, this.definition, this.breadcrumbs);

      setTimeout(() => this.scrollTop(), 100);
    },

    addWidget(widget) {
      console.error('Widget selected');
      console.log(widget);
      this.$emit('widget-selected', widget.name);
    }
  },
};
</script>

<template>
  <div>
    <div
      class="slide-in-glass"
      :class="{ 'slide-in-glass-open': isOpen }"
      @click="close()"
    />
    <div
      class="slide-in"
      :class="{ 'slide-in-open': isOpen }"
      :style="{ width, right, top, height }"
    >
      <div
        ref="resizer"
        class="panel-resizer"
        :style="{ position: resizePosition, left: resizeLeft }"
        @pointerdown="startPanelResize"
        @pointermove="doPanelResize"
        @pointerup="endPanelResize"
      />
      <div class="main-panel">
        <div class="header">
          <div
            @click="scrollTop()"
          >
            <span v-if="id">Edit Properties</span>
            <span v-else>Add Widget</span>
          </div>
          <i
            class="icon icon-close"
            @click="close"
          />
        </div>
        <div
          v-if="isOpen && !id"
          class="catalog-items"
        >
          <div
            v-for="widget in catalog" :key="widget.name"
            class="catalog-item"
            @click="addWidget(widget)"
          >
            <div
              class="catalog-icon"
            >
              <img
                v-if="widget.widget.icon"
                :src="widget.widget.icon"
              />
              <div
                v-else
              >
                ICON
              </div>
            </div>
            <div class="catalog-metadata">
              <div class="catalog-title">
                {{ widget.widget.title || widget.name}}
              </div>
              <div
                v-if="widget.widget.description"
                class="catalog-description"
              >
                {{ widget.widget.description }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpen && id">
          <div
            v-for="prop in properties"
            :key="prop.name"
            class="properties mt-10"
          >
           <ColorInput
              v-if="prop.type == 'color'"
              v-model:value="prop.value"
              :label="prop.label"
            />

            <LabeledInput
              v-else
              v-model:value="prop.value"
              :label="prop.label"
            />
          </div>
          <div class="properties-buttons mt-20">
            <button
              type="button"
              @click="discardProperties()"
              class="role-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveProperties()"
              class="role-primary"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $slidein-width: 33%;

  // Catalog

  .catalog-items {
    display: flex;
    flex-direction: column;

    .catalog-item {
      display: flex;
      height: 72px;
      cursor: pointer;
      padding: 5px;

      &:hover {
        background: #eee;
      }

      .catalog-icon {
        width: 128px;
        margin-right: 10px;
        max-height: 30px;
        display: flex;
        justify-content: center;

        > img {
          max-width: 128px;
          height: 60px;
        }
      }

      .catalog-metadata {
        flex: 1;

        .catalog-title {
          font-weight: bold;
        }

        .catalog-description {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }
      }
    }
  }

  .panel-resizer {
    position: absolute;
    height: 100%;
    border: 2px solid transparent;

    &:hover {
      border: 2px solid var(--primary);
      cursor: col-resize;
    }
  }

  .main-panel {
    padding-left: 4px;
    display: flex;
    flex-direction: column;
    overflow: auto;

    .select-resource {
      font-size: 16px;
      margin: 40px;
      text-align: center;

      > svg, i {
        margin-bottom: 20px;
        opacity: 0.5;
        height: 64px;
        width: 64px;
      }

      // Ensure the icon uses the correct color for the theme
      > svg {
        fill: var(--body-text);
      }

      > i {
        font-size: 64px;
      }
    }
  }

  .header {
    align-items: center;
    display: flex;
    padding: 4px;
    border-bottom: 1px solid var(--border);

    .breadcrumbs {
      display: flex;
      flex-wrap: wrap;

      .breadcrumb-link {
        color: var(--text);

        &:hover {
          color: var(--link);
        }
      }
    }

    > :first-child {
      flex: 1;
      font-weight: bold;
    }

    > i {
      padding: 8px;
      opacity: 0.7;

      &:hover {
        background-color: var(--primary);
        color: var(--primary-text);
        cursor: pointer;
        opacity: 1;
      }
    }
  }

  .loading {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;

    .icon-spinner {
      font-size: 24px;
    }
  }

  .glass {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }

  .slide-in {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    z-index: 2000;
    width: $slidein-width;
    background-color: var(--body-bg);
    right: -$slidein-width;
    transition: right 0.5s;
    border-left: 1px solid var(--border);
  }

  .slide-in-open {
    right: 0;
  }

  .explain-panel {
    padding: 10px;
  }

  .slide-in-glass {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      height :100vh;
      width: 100vw;

    &.slide-in-glass-open {
      background-color: var(--body-bg);
      display: block;
      opacity: 0.5;
      z-index: 1000;
    }
  }

  .panel-loading {
    margin-top: 20px;
  }

  .properties {
    padding: 10px;
  }

  .properties-buttons {
    display: flex;
    justify-content: flex-end;
    margin: 0 10px;

    > button:not(:first-child) {
      margin-left: 10px;
    }

  }
</style>
