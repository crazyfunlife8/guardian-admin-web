import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSourcesStore = defineStore('sources', () => {
  const sources = ref([
    { id: 'a', label: '反饋',   status: 'ok' },
    { id: 'b', label: '感測',   status: 'ok' },
    { id: 'c', label: '開放資料', status: 'warn' },
    { id: 'd', label: '合作',   status: 'ok' },
    { id: 'e', label: '機率批次', status: 'ok' },
    { id: 'f', label: '熱點',   status: 'ok' },
    { id: 'g', label: '情報網', status: 'danger' },
  ])

  function updateStatus(id, status) {
    const src = sources.value.find(s => s.id === id)
    if (src) src.status = status
  }

  return { sources, updateStatus }
})
