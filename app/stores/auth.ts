import { defineStore } from 'pinia'
// interface USERINFO  {
//     id: string,
//     email: string,
//     full_name: string,
//     name: string,
//     picture: string
// }
export const useAuthStore = defineStore('auth', {
  state: () => ({  user: {} }),
  getters: {
    authenticated_user(state) { return state.user }
  },
  actions: {
    setUser(userInfo) {
      console.log("userInfo",userInfo)
      this.$state.user = userInfo
    },
  },
})