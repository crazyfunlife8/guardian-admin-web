import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function show(message, type = 'success') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    if (type !== 'error') {
      setTimeout(() => remove(id), 4000)
    }
  }

  function remove(id) {
    const i = toasts.value.findIndex(t => t.id === id)
    if (i >= 0) toasts.value.splice(i, 1)
  }

  const success = (msg) => show(msg, 'success')
  const error   = (msg) => show(msg, 'error')
  const info    = (msg) => show(msg, 'info')

  return { toasts, show, remove, success, error, info }
})
