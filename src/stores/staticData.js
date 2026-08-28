import { ref } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

// 合作來源授權範圍選項（UI 顯示用；源主檔管理 API 尚未定義）
export const SCOPE_OPTIONS = [
  { value: 'display',     label: '可上圖' },
  { value: 'push',        label: '可推播' },
  { value: 'probability', label: '可入機率層' },
  { value: 'attribution', label: '需標示出處' },
]

function mapHotspot(d) {
  return {
    id:          String(d.id),
    name:        d.roadSegment ?? '',   // API 欄位為 roadSegment，UI 顯示為「名稱」
    lat:         d.lat ?? 0,
    lng:         d.lng ?? 0,
    enabled:     d.enabled ?? true,
    sourceId:    d.sourceId ?? null,
    createdAt:   d.createdAt ? d.createdAt.slice(0, 10) : '',
  }
}

function mapCoverageArea(d) {
  return {
    id:            String(d.id),
    name:          d.name ?? '',
    coverageLevel: d.coverageLevel ?? '',
    geometry:      d.geometry ?? null,
    createdAt:     d.createdAt ? d.createdAt.slice(0, 10) : '',
  }
}

function mapSource(d) {
  return {
    id:      d.id,
    name:    d.name    ?? '',
    scopes:  d.scopes  ?? [],
    purpose: d.purpose ?? '',
    deleted: d.deleted ?? false,
  }
}

export const useStaticDataStore = defineStore('staticData', () => {
  const hotspots      = ref([])
  const coverageAreas = ref([])

  const sourceMasters = ref([])

  async function loadHotspots() {
    try {
      const { data } = await client.get('/api/backend/hotspots')
      hotspots.value = data.map(mapHotspot)
    } catch (err) {
      console.error('loadHotspots failed', err)
    }
  }

  async function addHotspot(data) {
    const { data: created } = await client.post('/api/backend/hotspots', {
      lat:         data.lat,
      lng:         data.lng,
      roadSegment: data.name,
      enabled:     true,
    })
    hotspots.value.push(mapHotspot(created))
  }

  async function updateHotspot(id, patch) {
    const { data: updated } = await client.put(`/api/backend/hotspots/${id}`, {
      lat:         patch.lat,
      lng:         patch.lng,
      roadSegment: patch.name,
      enabled:     patch.enabled ?? true,
    })
    const idx = hotspots.value.findIndex(h => h.id === id)
    if (idx !== -1) hotspots.value[idx] = mapHotspot(updated)
  }

  async function disableHotspot(id) {
    await client.post(`/api/backend/hotspots/${id}/disable`)
    const hs = hotspots.value.find(h => h.id === id)
    if (hs) hs.enabled = false
  }

  async function deleteHotspot(id) {
    await client.delete(`/api/backend/hotspots/${id}`)
    const idx = hotspots.value.findIndex(h => h.id === id)
    if (idx !== -1) hotspots.value.splice(idx, 1)
  }

  async function loadCoverageAreas() {
    try {
      const { data } = await client.get('/api/backend/coverage-areas')
      coverageAreas.value = data.map(mapCoverageArea)
    } catch (err) {
      console.error('loadCoverageAreas failed', err)
    }
  }

  async function addCoverageArea(data) {
    const { data: created } = await client.post('/api/backend/coverage-areas', data)
    coverageAreas.value.push(mapCoverageArea(created))
  }

  async function updateCoverageArea(id, patch) {
    const { data: updated } = await client.put(`/api/backend/coverage-areas/${id}`, patch)
    const idx = coverageAreas.value.findIndex(a => a.id === id)
    if (idx !== -1) coverageAreas.value[idx] = mapCoverageArea(updated)
  }

  async function deleteCoverageArea(id) {
    await client.delete(`/api/backend/coverage-areas/${id}`)
    const idx = coverageAreas.value.findIndex(a => a.id === id)
    if (idx !== -1) coverageAreas.value.splice(idx, 1)
  }

  // 合作來源主檔 CRUD（已串接 /api/backend/sources；缺口 #10）
  async function loadSources() {
    try {
      const { data } = await client.get('/api/backend/sources')
      sourceMasters.value = data.map(mapSource)
    } catch (err) {
      console.error('loadSources failed', err)
    }
  }

  async function addSource(data) {
    const { data: created } = await client.post('/api/backend/sources', data)
    sourceMasters.value.push(mapSource(created))
  }

  async function updateSource(id, patch) {
    const { data: updated } = await client.put(`/api/backend/sources/${id}`, patch)
    const idx = sourceMasters.value.findIndex(s => s.id === id)
    if (idx !== -1) sourceMasters.value[idx] = mapSource(updated)
  }

  async function deleteSource(id) {
    await client.delete(`/api/backend/sources/${id}`)
    const src = sourceMasters.value.find(s => s.id === id)
    if (src) src.deleted = true
  }

  async function enableSource(id) {
    await client.post(`/api/backend/sources/${id}/enable`)
    const src = sourceMasters.value.find(s => s.id === id)
    if (src) src.deleted = false
  }

  // 服務區域邊界
  const serviceBoundary = ref('')

  async function loadBoundary() {
    try {
      const { data } = await client.get('/api/backend/service-boundary')
      const geojson = data.configured && data.geometry
        ? JSON.stringify(data.geometry, null, 2)
        : JSON.stringify(data.defaultBounds ?? {}, null, 2)
      serviceBoundary.value = geojson
    } catch (err) {
      console.error('loadBoundary failed', err)
    }
  }

  async function updateBoundary(geojson) {
    const geometry = JSON.parse(geojson)
    await client.put('/api/backend/service-boundary', { geometry })
    serviceBoundary.value = geojson
  }

  return {
    hotspots, coverageAreas, sourceMasters, serviceBoundary,
    loadHotspots, addHotspot, updateHotspot, disableHotspot, deleteHotspot,
    loadCoverageAreas, addCoverageArea, updateCoverageArea, deleteCoverageArea,
    loadSources, addSource, updateSource, deleteSource, enableSource,
    loadBoundary, updateBoundary,
  }
})
