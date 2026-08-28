import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const mustChangePassword = ref(false)
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(username, password) {
    const { data } = await client.post('/api/auth/backend/login', { username, password })
    accessToken.value = data.accessToken
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    mustChangePassword.value = !!data.mustChangePassword
    if (!mustChangePassword.value) await fetchMe()
  }

  async function fetchMe() {
    try {
      const { data } = await client.get('/api/auth/backend/me')
      user.value = data
    } catch {
      // token might be stale; client interceptor will handle redirect
    }
  }

  async function changePassword(currentPassword, newPassword) {
    await client.post('/api/backend/accounts/me/password', { currentPassword, newPassword })
    mustChangePassword.value = false
    await fetchMe()
  }

  async function logout() {
    try { await client.post('/api/auth/backend/logout') } catch {}
    accessToken.value = ''
    mustChangePassword.value = false
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  if (accessToken.value) fetchMe()

  return { accessToken, mustChangePassword, user, isLoggedIn, login, changePassword, logout, fetchMe }
})
