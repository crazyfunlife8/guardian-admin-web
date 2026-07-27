import { ref } from 'vue'
import { defineStore } from 'pinia'

// 合作來源授權範圍選項（技術綱要 source_master）
export const SCOPE_OPTIONS = [
  { value: 'display',     label: '可上圖' },
  { value: 'push',        label: '可推播' },
  { value: 'probability', label: '可入機率層' },
  { value: 'attribution', label: '需標示出處' },
]

let _hsSeq = 4
let _smSeq = 3

export const useStaticDataStore = defineStore('staticData', () => {
  // ── 熱點清單 ──────────────────────────────────────────────────
  const hotspots = ref([
    { id: 'HS-001', name: '基隆市區熱點',     lat: 25.1276, lng: 121.7392, radius: 500 },
    { id: 'HS-002', name: '台北火車站周邊',   lat: 25.0478, lng: 121.5170, radius: 800 },
    { id: 'HS-003', name: '中山高速公路匝道', lat: 25.0830, lng: 121.5654, radius: 300 },
  ])

  function addHotspot(data) {
    const id = `HS-${String(_hsSeq++).padStart(3, '0')}`
    hotspots.value.push({ id, ...data })
  }

  function updateHotspot(id, patch) {
    const hs = hotspots.value.find(h => h.id === id)
    if (hs) Object.assign(hs, patch)
  }

  function deleteHotspot(id) {
    const idx = hotspots.value.findIndex(h => h.id === id)
    if (idx !== -1) hotspots.value.splice(idx, 1)
  }

  // ── 合作來源主檔（PRD C4）────────────────────────────────────
  const sourceMasters = ref([
    {
      id: 'SM-001',
      name: '北市警察局事故通報',
      scopes: ['display', 'push'],
      purpose: '重大事故即時通報，含封閉路段與事故類型',
    },
    {
      id: 'SM-002',
      name: '道路工程資訊聯盟',
      scopes: ['display', 'attribution'],
      purpose: '道路施工封閉通知，需標示資料來源',
    },
  ])

  function addSource(data) {
    const id = `SM-${String(_smSeq++).padStart(3, '0')}`
    sourceMasters.value.push({ id, ...data })
  }

  function updateSource(id, patch) {
    const s = sourceMasters.value.find(s => s.id === id)
    if (s) Object.assign(s, patch)
  }

  function deleteSource(id) {
    const idx = sourceMasters.value.findIndex(s => s.id === id)
    if (idx !== -1) sourceMasters.value.splice(idx, 1)
  }

  // ── 服務區域邊界（架構留門②，規格外，待確認）────────────────
  const serviceBoundary = ref(
    JSON.stringify({
      type: 'Polygon',
      coordinates: [[[121.45, 24.95], [121.85, 24.95], [121.85, 25.25], [121.45, 25.25], [121.45, 24.95]]],
    }, null, 2)
  )

  function updateBoundary(geojson) {
    serviceBoundary.value = geojson
  }

  return {
    hotspots, addHotspot, updateHotspot, deleteHotspot,
    sourceMasters, addSource, updateSource, deleteSource,
    serviceBoundary, updateBoundary,
  }
})
