import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

let refreshPromise = null

client.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!refreshPromise) {
        const refreshToken = localStorage.getItem('refreshToken')
        refreshPromise = axios
          .post(`${BASE_URL}/api/auth/backend/refresh`, { refreshToken })
          .then(r => {
            localStorage.setItem('accessToken', r.data.accessToken)
            if (r.data.refreshToken) localStorage.setItem('refreshToken', r.data.refreshToken)
          })
          .catch(() => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.hash = '#/login'
          })
          .finally(() => { refreshPromise = null })
      }
      await refreshPromise
      return client(original)
    }
    return Promise.reject(err)
  }
)

export { BASE_URL }
export default client
