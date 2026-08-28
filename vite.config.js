import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: command === 'build' ? '/guardian-admin-web/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://guardian.nest-creation.com',
        changeOrigin: true,
      },
    },
  },
}))
