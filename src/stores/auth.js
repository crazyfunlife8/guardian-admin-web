import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(username, password) {
    const { data } = await client.post('/api/auth/backend/login', { username, password })
    accessToken.value = data.accessToken
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    await fetchMe()
  }

  async function fetchMe() {
    try {
      const { data } = await client.get('/api/auth/backend/me')
      user.value = data
    } catch {
      // token might be stale; client interceptor will handle redirect
    }
  }

  async function logout() {
    try { await client.post('/api/auth/backend/logout') } catch {}
    accessToken.value = ''
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  // Restore user info on page reload if token exists
  if (accessToken.value) fetchMe()

  return { accessToken, user, isLoggedIn, login, logout, fetchMe }
})
