<script>
import 'gridstack/dist/gridstack.min.css';

import { GridStack } from 'gridstack';
import SlideInPanel from './SlideInPanel.vue';

import { randomStr } from '@shell/utils/string';

export default {
  name: 'Dashboards',

  layout: 'plain',

  components: { SlideInPanel },

  data() {
    const catalogWidgets = this.$plugin.getAll().widget || {};
    const catalog = [];

    Object.keys(catalogWidgets).forEach((name) => {
      const component = catalogWidgets[name];

      catalog.push({
        name,
        component,
        widget: component.widget || {},
      });
    });

    const widgetStr = window.localStorage.getItem('rancher.dashboard.widgets');
    let widgets = [];

    if (widgetStr) {
      widgets = JSON.parse(widgetStr);
    }

    console.error('LOADING');
    console.error(widgets);

    let items = [
      {x: 0, y: 0, w: 4, h: 2, content: '1'},
      {x: 4, y: 0, w: 4, h: 4, noMove: true, noResize: true, locked: true, content: 'I can\'t be moved or dragged!<br><ion-icon name="ios-lock" style="font-size:300%"></ion-icon>'},
      {x: 8, y: 0, w: 2, h: 2, minW: 2, noResize: true, content: '<p class="card-text text-center" style="margin-bottom: 0">Drag me!<p class="card-text text-center"style="margin-bottom: 0"><ion-icon name="hand" style="font-size: 300%"></ion-icon><p class="card-text text-center" style="margin-bottom: 0">...but don\'t resize me!'},
      {x: 10, y: 0, w: 2, h: 2, content: '4'},
      {x: 0, y: 2, w: 2, h: 2, content: '5'},
      {x: 2, y: 2, w: 2, h: 4, content: '6'},
      {x: 8, y: 2, w: 4, h: 2, content: '7'},
      {x: 0, y: 4, w: 2, h: 2, content: '8'},
      {x: 4, y: 4, w: 4, h: 2, content: '9'},
      {x: 8, y: 4, w: 2, h: 2, content: '10'},
      {x: 10, y: 4, w: 2, h: 2, content: '11'},
    ];

    widgets.forEach((w) => {
      w.added = false;
      w.component = catalogWidgets[w.widget];

      w.props = w.props || {};

      // const uuid = randomStr();
      // const id = `grid-item-${ uuid }`;

      // w.options['gs-id'] = id;
      // w.id = id;
      // delete w.options.id;

      console.log('-----');
      console.log(w.id);
      console.log(w.component?.widget.props);
      w.hasProps = w.component?.widget?.props?.length > 0;
    });

    console.log(widgets);

    return {
      grid: undefined,
      toolbarStyle: {},
      widgets,
      catalog,
      catalogWidgets,
      editMode: false,
      addMode: false,
      backup: [],
    };
  },

  mounted() {
    // Provides access to the GridStack instance across the Vue component.
    this.grid = GridStack.init({
      animate: false,
      alwaysShowResizeHandle: true,
      disableOneColumnMode: true,
      // disableDrag: true,
      // disableResize: true,
      staticGrid: true,
      // float: true,
      cellHeight: '70px',
      minRow: 1,
      auto: false
    });

    const buttons = document.querySelectorAll('[data-testid=extension-header-action-dashboard-toggle-edit]');
    const button = buttons.length === 1 ? buttons[0] : null;

    if (!!button) {
    // Hook into the edit button that we added
      buttons[0].addEventListener('click', () => {
        this.editMode = true;

        const right = window.innerWidth - (button.offsetLeft + button.offsetWidth);

        this.toolbarStyle = {right: `${ right }px`};

        // this.grid.enable();
        // this.grid.enableMove(true);

        this.grid.setStatic(false);

        // console.error('----------------------------------------------------------------');

        // this.widgets.forEach((w) => {
        //   console.log(w);

        //   // this.grid.movable(`#${ w.id }`, true);

        //   if (!w.component?.widget?.noResize) {
        //     console.log(`#${ w.id } can be resized`);
        //     this.grid.resizable(`#${ w.id }`, true);
        //   } else {
        //     console.log(`#${ w.id } can NOT be resized`);
        //     this.grid.resizable(`#${ w.id }`, false);
        //   }
        // });

        // console.error('----------------------------------------------------------------');

        this.edit();
      });
    }

      this.grid.on('dragstop', (event, el) => {
      this.updateWidget(el.gridstackNode);
      // this.grid.compact('list');
    });

    this.grid.on('resizestop', (event, el) => {
      this.updateWidget(el.gridstackNode);
      // this.grid.compact('list');
    });

    setTimeout(() => this.makeWidgets(), 0);
  },

  updated() {
    this.makeWidgets();
  },

  methods: {

    openCatalog() {
      const slideIn = this.$refs.slideInPanel;

      slideIn.open();

      this.addMode = true;

      this.grid.save();
    },

    editProperties(w) {
      const slideIn = this.$refs.slideInPanel;

      slideIn.open(w.id, w.component?.widget?.props, w.props);

      this.addMode = true;
    },

    closeCatalog(id, properties) {
      this.addMode = false;

      if (id && properties) {
        const widget = this.widgets.find((w) => w.id === id);

        if (widget) {
          widget.props = widget.props || {};

          properties.forEach((prop) => {
            widget.props[prop.name] = prop.value;
          });
        }
      }
    },

    makeWidgets() {
      this.widgets.forEach((w) => {
        if (!w.added) {
          w.added = true;
          const el = this.grid.makeWidget(`#${ w.id }`);

          this.grid.update(el, w.options);

          // if (w.options['gs-no-resize']) {
          //   console.error('*** Setting no-resize option');

          //   this.grid.resizable(el, false);
          // }
        }
      });
    },

    edit() {
      // Backup the current widget configuration
      this.backup = this.currentConfig();

      // setTimeout(() => {
      //   console.error('!!!!!!!!!');

      //   this.widgets.forEach((w) => {
      //     console.log(w);

      //     if (w.component?.widget?.noResize) {
      //       console.log('NEED TO UPDATE WIDGET FOR NO RESIZE');
      //       w.options.noResize = true;
      //       this.grid.update(`#${ w.id }`, w.options);
      //     }
      //   });
      // }, 250);
    },

    currentConfig() {
      const copy = JSON.parse(JSON.stringify(this.widgets));
      copy.forEach((w) => {
        delete w.component;
        w.added = false;
      });

      console.log(copy);

      return copy;
    },

    save() {
      const data = this.currentConfig();

      window.localStorage.setItem('rancher.dashboard.widgets', JSON.stringify(data)); 

      // const items = this.grid.save(true, true);
      // console.error('HELLO');
      // console.log(data);
      // console.log(items);

      // items.forEach((item) => {


      // });

      this.exitEditMode();
    },

    cancel() {
      // Remove all
      this.widgets.forEach((w) => {
        this.grid.removeWidget(`#${ w.id }`);
      });

      this.widgets = [];

      setTimeout(() => {
        this.widgets = this.backup;
        this.widgets.forEach((w) => {
          this.widgets.forEach((w) => {
            w.added = false;
            w.component = this.catalogWidgets[w.widget];
          });
        })
      }, 0);

      console.log(this.widgets);
      
      // this.grid.removeAll(false);
      // setTimeout(() => {
      //   this.widgets = this.backup; 
      // }, 500);
      this.exitEditMode();

      // this.makeWidgets();
    },

    exitEditMode() {
      this.editMode = false;
      // this.grid.disable();

      this.grid.setStatic(true);
    },

    updateWidget(node) {
      const widget = this.widgets.find((w) => w?.options.id === node.el.id);

      if (widget?.options) {
        widget.options.x = node.x;
        widget.options.y = node.y;
        widget.options.w = node.w;
        widget.options.h = node.h;
        widget.options.noResize = widget.component?.widget.noResize || false;
        // widget.options.noResize = w.component.
        //widget.options['gs-noResize'] = 
      }
    },

    deleteWidget(widget) {
      // Remove widget from the list and the grid
      this.widgets = this.widgets.filter((w) => w.id !== widget.id);

      this.grid.removeWidget(`#${ widget.options.id }`);
    },

    addWidgetFromCatalog(widget) {
      this.addNewWidget(widget);

      const slideIn = this.$refs.slideInPanel;

      slideIn.close();
    },

    addNewWidget(name = 'Square') {
      const uuid = randomStr();
      const id = `grid-item-${ uuid }`;

      const options = {
        x: Math.round(12 * Math.random()),
        y: Math.round(5 * Math.random()),
        w: 3,
        h: 3,
        id: id,
      };

      // Always add new widget to the next free row
      let row = 0;

      this.widgets.forEach((w) => {
        const wr = w.options.y + w.options.h;

        if (wr > row) {
          row = wr;
        }
      });

      options.x = 0;
      options.y = row + 1;

      const widget = name;
      const component = this.catalogWidgets[widget];

      // Get default width and height from widget
      if (component?.widget) {
        options.w = component.widget.width || 3;
        options.h = component.widget.height || 3;

        options.style = component.widget.style;

        if (component.widget.noResize) {
          console.error('WIDGET CAN NOT BE RESIZED');
          options.noResize = true;
        }
      }

      // Apply defaults to props
      const props = {};

      if (component?.widget?.props) {
        component.widget.props.forEach((prop) => {
          if (prop.default) {
            props[prop.name] = prop.default;
          }
        });
      }

      this.widgets.push({
        added: false,
        id: id,
        widget,
        component,
        options,
        props,
        hasProps: component?.widget?.props?.length > 0,
      });

      // this.grid.addWidget(options);
    },
  }
};
</script>

<template>
  <div>
    <SlideInPanel
      :catalog="catalog"
      ref="slideInPanel"
      @widget-selected="addWidgetFromCatalog"
      @closed="closeCatalog"
    />
    <div
      ref="grid"
      class="grid-stack"
    >
      <div
        v-for="w in widgets"
        :key="w.id"
        :id="w.id"
        :style="w.options.style"
        class="grid-stack-item"
        :class="{'dashboard-editing': editMode}"
      >
        <div
          class="grid-stack-item-content rancher-grid-item"
          :style="w.options.style"
        >
          <div v-if="editMode" class="edit-glass"></div>
          <div v-if="editMode" class="edit-actions">
            <div class="edit-toolbar">
              <button
                v-if="w.hasProps"
                type="button"
                @click="editProperties(w)"
                class="edit-properties-widget"
              >
                <i class="icon icon-list-flat"/>
              </button>
              <button
                type="button"
                @click="deleteWidget(w)"
                class="delete-widget"
              >
                <i class="icon icon-trash"/>
              </button>
            </div>
          </div>
          <component
            v-if="w.component"
            :is="w.component"
            v-bind="w.props"
          >
          </component>
        </div>
      </div>
    </div>
    <!-- Changes to support edit mode -->
    <div v-if="editMode && !addMode">
      <div class="dashboard-edit-mode-sidebar"></div>
      <div class="dashboard-edit-mode-header"></div>
      <div
        :style="toolbarStyle"
        class="dashboard-edit-toolbar"
      >
        <button
          type="button"
          @click="openCatalog()"
          class="button-spacer"
        >
          Add Widget
        </button>

        <button
          type="button"
          @click="cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="save"
        >
          Save
        </button>
      </div>
    </div>

    <div
      class="empty-dashboard"
      :class="{'not-shown': widgets.length }"
    >
      <i class="icon icon-dashboard" />
      <div class="heading">
        Dashboard empty
      </div>
      <div>Add widgets to the dashboard from edit mode</div>
    </div>

  </div>
</template>

<style lang="scss" scoped>

  .rancher-grid-item {
    border: 1px solid var(--border);
  }

  .dashboard-edit-mode-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 70px;
    background-color: #fff;
    opacity: 0.75;
    z-index: 2000;
  }

  .dashboard-edit-mode-header {
    position: absolute;
    top: 0;
    left: 60px;
    width: calc(100% - 60px);
    height: var(--header-height);
    background-color: #fff;
    opacity: 0.75;
    z-index: 2000;
  }  

  .dashboard-edit-toolbar {
    position: absolute;
    top: 5px;
    height: calc(var(--header-height) - 10px);
    z-index: 2000;
  }

  .dashboard-edit-toolbar {
    background-color: #777;
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0px 16px;

    > button {
      min-height: 24px;
      line-height: 24px;
      padding: 0 12px;

      &.button-spacer {
        margin-right: 20px;
      }
    }

    > button:not(:first-child) {
      margin-left: 10px;
    }
  }

  .dashboard-editing {
    .rancher-grid-item {
      cursor: move;
      // pointer-events: none;
      opacity: 0.7;

      border: 1px solid #777 !important;

      overflow: hidden;
    }
  }

  .edit-glass {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #fff;
    opacity: 0.1;
    z-index: 1000;
  }

  .edit-actions {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .edit-toolbar {
      background: #777;
      padding: 4px;
      //border-radius: 10px;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;

      > button {
        min-height: 24px;
        line-height: 24px;
        padding: 4px;

        > i {
          font-size: 20px;
        }
      }

      .delete-widget:hover {
        color: red;
      }

      .edit-properties-widget {
        margin-right: 10px;

        &:hover {
          color: var(--primary);
        }
      }
    }
  }

  .not-shown {
    opacity: 0;
  }

  .empty-dashboard {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-top: 100px;
    position: static;

    > i {
      font-size: 64px;
      opacity: 0.75;
    }

    > div {
      opacity: 0.75;
    }

    > div.heading {
      font-size: 32px;
      margin: 20px 0;
    }
  }
</style>
