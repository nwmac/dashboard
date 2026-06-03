import { Component } from 'vue';

export enum SlideInWidth {
  Default = '33%', // eslint-disable-line no-unused-vars
  Wide = '73%' // eslint-disable-line no-unused-vars
}

/**
 *
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 */
export interface SlideInConfig {
  /**
   *
   * title for the Slide-In panel. If not set, the panel header is not shown and the main component must take care of showing a header and close button if needed.
   *
   */
  title?: string;
  /**
   *
   * Width of the Slide-In panel
   *
   */
  width?: SlideInWidth;
  /**
   *
   * Whether the slide-in is full-height or appears below the header bar (which is the default)
   */
  fullHeight?: boolean;
  /**
   *
   * Array of props to watch out for in route, when they change, closes Slide-In
   * @ignore
   *
   */
  closeOnRouteChange?: [string];
  /**
   *
   * Don't focus the first focusable element in the Slide-In when it opens. Useful for Slide-Ins that are used for non-interactive purposes, like displaying information, and don't require user interaction.
   *
   */
  triggerFocusTrap?: boolean;
  /**
   *
   * Return focus selector for focus trap
   * @ignore
   *
   */
  returnFocusSelector?: string;
  /**
   *
   * We can pass variable (value) to "force" focus trap to initialize "on-demand"
   * @ignore
   *
   */
  focusTrapWatcherBasedVariable?: boolean;
}

/**
 *
 * Vue Props to pass directly to the component rendered inside the slide in panel in an object format as "props=..."
 *
 * Useful for passing additional information or context to the component rendered inside the Slide-In window
 *
 */
export interface SlideInComponentProps {
  [key: string]: any;
}

/**
 * API for displaying Slide-In panels in Rancher UI
 * * ![slidein Example](/img/slidein.png)
 */
export interface SlideInApi {
  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open('Hello from SlideIn panel!', MyCustomSlideIn);
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param component
   * The Vue component to be displayed inside the slide in panel.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * @param props Properties for the component to be displayed inside the slide in panel
   *
   * @param config Slide-In configuration object
   *
   */
  open(title: string, component: Component, props?: SlideInComponentProps, config?: SlideInConfig): void;
  open(component: Component, props?: SlideInComponentProps, config?: SlideInConfig): void;
}
