import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    token: null
  },
  getters: {
    isLoggedIn: state => !!state.token,
    currentUser: state => state.user
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setToken(state, token) {
      state.token = token
    },
    logout(state) {
      state.user = null
      state.token = null
    }
  },
  actions: {
    login({ commit }, userData) {
      commit('setUser', userData)
      commit('setToken', 'fake-token')
    },
    logout({ commit }) {
      commit('logout')
    }
  },
  modules: {}
})
