import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';

export interface SlideInPanelState {
  isOpen: boolean;
  isClosing: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
}

const state = (): SlideInPanelState => ({
  isOpen:         false,
  isClosing:      false,
  component:      null,
  componentProps: {}
});

let closingTimeout: NodeJS.Timeout | undefined;

const getters: GetterTree<SlideInPanelState, any> = {
  isOpen:         (state) => state.isOpen,
  isClosing:      (state) => state.isClosing,
  component:      (state) => state.component,
  componentProps: (state) => state.componentProps
};

const mutations: MutationTree<SlideInPanelState> = {
  open(state, payload: { component: Component; componentProps?: Record<string, any> }) {
    state.isOpen = true;

    // Make sure if we are still in the process of closing, we clear the timeout and reset the state
    state.isClosing = false;
    clearTimeout(closingTimeout);

    state.component = !!payload.component ? markRaw(payload.component) : null;
    state.componentProps = payload.componentProps || {};
  },
  close(state) {
    state.isClosing = true;
    state.isOpen = false;

    clearTimeout(closingTimeout);

    // Delay clearing component/props for 500ms (same as transition duration)
    closingTimeout = setTimeout(() => {
      state.component = null;
      state.componentProps = {};

      state.isClosing = false;
    }, 500);
  }
};

const actions: ActionTree<SlideInPanelState, any> = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
