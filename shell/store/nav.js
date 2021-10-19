export const state = () => ({ nav: [] });

export const mutations = {
  addNav(state, item) {
    state.nav.push(item);
  },
};

export const getters = {
  getNav: (state) => {
    return state.nav;
  }
};
