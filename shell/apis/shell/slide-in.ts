import { Component } from 'vue';
import { SlideInApi, SlideInComponentProps, SlideInConfig } from '@shell/apis/intf/shell';
import { Store } from 'vuex';

export class SlideInApiImpl implements SlideInApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import { useShell } from '@shell/apis';
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * const shell = useShell();
   *
   * shell.slideIn.open(MyCustomSlideIn, {
   *   title: 'Hello from SlideIn panel!'
   * });
   * ```
   *
   * @param component - A Vue component (imported SFC, functional component, etc.) to be rendered in the panel.
   * @param config - Slide-In configuration object
   */
  // public open(title: string, component: Component, props?: SlideInComponentProps, config?: SlideInConfig): vo
  // public open(component: Component, props?: SlideInComponentProps, config?: SlideInConfig): void
  public open(
    titleOrComponent: string | Component,
    componentOrProps?: Component | SlideInComponentProps,
    propsOrConfig?: SlideInComponentProps | SlideInConfig,
    config?: SlideInConfig
  ): void {
    if (typeof titleOrComponent === 'string') {
      // titleOrComponent is the title, componentOrProps is the component
      const title = titleOrComponent;
      const component = componentOrProps as Component;
      const props = propsOrConfig || {} as SlideInComponentProps;

      this.store.commit('slideInPanel/open', {
        component,
        componentProps: {
          ...(config || {}),
          title,
          props
        }
      });
    } else {
      // titleOrComponent is the component, componentOrProps is the props
      const component = titleOrComponent as Component;
      const props = componentOrProps || {} as SlideInComponentProps;

      this.store.commit('slideInPanel/open', {
        component,
        componentProps: { ...(propsOrConfig || {}), props }
      });
    }
  }
}
