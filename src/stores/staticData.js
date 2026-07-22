import { ref } from 'vue'
import { defineStore } from 'pinia'

let _hsSeq  = 4
let _poiSeq = 4

export const TEMPLATE_META = [
  { key: 'event_alert',     label: '事件警示', vars: '{type}、{road}' },
  { key: 'task_broadcast',  label: '任務廣播', vars: '{road}' },
  { key: 'task_timeout',    label: '任務逾時', vars: '{road}' },
  { key: 'task_complete',   label: '任務完成', vars: '{road}' },
  { key: 'points_credited', label: '積分入帳', vars: '{points}、{total}' },
]

export const POI_TYPES = ['收費站', '易堵路段', '匝道', '警察局', '其他']

export const useStaticDataStore = defineStore('staticData', () => {
  const hotspots = ref([
    { id: 'HS-001', name: '基隆市區熱點',     lat: 25.1276, lng: 121.7392, radius: 500 },
    { id: 'HS-002', name: '台北火車站周邊',   lat: 25.0478, lng: 121.5170, radius: 800 },
    { id: 'HS-003', name: '中山高速公路匝道', lat: 25.0830, lng: 121.5654, radius: 300 },
  ])

  const mapPOIs = ref([
    { id: 'POI-001', label: '基隆收費站',   lat: 25.1068, lng: 121.7270, type: '收費站' },
    { id: 'POI-002', label: '圓山易堵路段', lat: 25.0716, lng: 121.5195, type: '易堵路段' },
    { id: 'POI-003', label: '重慶北路匝道', lat: 25.0644, lng: 121.4861, type: '匝道' },
  ])

  const notifyTemplates = ref({
    event_alert:     '道路事件提醒：{road}段發生{type}，請注意行車安全。',
    task_broadcast:  '您附近有驗證任務，路段：{road}，請確認後接受任務。',
    task_timeout:    '任務已逾時（{road}），系統將自動升廣播範圍，感謝耐心等待。',
    task_complete:   '感謝您完成驗證任務！{road}事件資訊已更新。',
    points_credited: '積分入帳通知：您已獲得 {points} 點，累積總積分 {total} 點。',
  })

  const serviceBoundary = ref(
    JSON.stringify({
      type: 'Polygon',
      coordinates: [[[121.45, 24.95], [121.85, 24.95], [121.85, 25.25], [121.45, 25.25], [121.45, 24.95]]],
    }, null, 2)
  )

  // ── Hotspot ──────────────────────────────────────────────
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

  // ── POI ──────────────────────────────────────────────────
  function addPOI(data) {
    const id = `POI-${String(_poiSeq++).padStart(3, '0')}`
    mapPOIs.value.push({ id, ...data })
  }

  function updatePOI(id, patch) {
    const poi = mapPOIs.value.find(p => p.id === id)
    if (poi) Object.assign(poi, patch)
  }

  function deletePOI(id) {
    const idx = mapPOIs.value.findIndex(p => p.id === id)
    if (idx !== -1) mapPOIs.value.splice(idx, 1)
  }

  // ── Template ─────────────────────────────────────────────
  function updateTemplate(key, text) {
    notifyTemplates.value[key] = text
  }

  // ── Boundary ─────────────────────────────────────────────
  function updateBoundary(geojson) {
    serviceBoundary.value = geojson
  }

  return {
    hotspots, mapPOIs, notifyTemplates, serviceBoundary,
    addHotspot, updateHotspot, deleteHotspot,
    addPOI, updatePOI, deletePOI,
    updateTemplate,
    updateBoundary,
  }
})
