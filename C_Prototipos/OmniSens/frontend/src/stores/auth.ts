import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const user = ref<any>(null)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('jwt_token', newToken)
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('jwt_token')
  }

  const isAuthenticated = () => !!token.value

  return { token, user, setToken, logout, isAuthenticated }
})
