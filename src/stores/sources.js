import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'

function mapSource(s) {
  let status = 'ok'
  if (s.stale) status = s.recentCount === 0 ? 'danger' : 'warn'
  return { id: s.sourceKey, label: s.displayName, status }
}

export const useSourcesStore = defineStore('sources', () => {
  const sources = ref([])
  let pollTimer = null

  async function fetch() {
    try {
      const { data } = await client.get('/api/backend/dashboard/sources')
      sources.value = data.map(mapSource)
    } catch {}
  }

  function startPoll() {
    fetch()
    pollTimer = setInterval(fetch, 30000)
  }

  function stopPoll() {
    clearInterval(pollTimer)
    pollTimer = null
  }

  function updateStatus(id, status) {
    const src = sources.value.find(s => s.id === id)
    if (src) src.status = status
  }

  return { sources, fetch, startPoll, stopPoll, updateStatus }
})
