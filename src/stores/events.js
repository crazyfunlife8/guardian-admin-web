import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client from '../api/client'

// ── API enum → display label ────────────────────────────────────────────────
export const TYPE_LABELS = {
  Checkpoint:   '臨時路檢',
  Accident:     '事故',
  Construction: '施工',
  Control:      '管制',
  Flooding:     '積水',
}

export const STATUS_LABELS = {
  Unconfirmed: '未確認',
  Verified:    '已驗證',
  Expired:     '已過期',
  Cleared:     '已解除',
  FalseReport: '誤報',
}

// ── EventCard / OP-2 action → API toStatus ─────────────────────────────────
const ACTION_TO_STATUS = {
  confirm:        'Verified',
  'false-report': 'FalseReport',
  takedown:       'FalseReport',
  cleared:        'Cleared',
  resolve:        'Cleared',
}

// ── helpers ─────────────────────────────────────────────────────────────────
function computeAgo(isoStr) {
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (mins < 1) return '剛剛'
  if (mins < 60) return `${mins} 分鐘前`
  const hrs = Math.floor(mins / 60)
  return `${hrs} 小時前`
}

function computeTtlMin(isoStr) {
  if (!isoStr) return null
  const mins = Math.round((new Date(isoStr).getTime() - Date.now()) / 60000)
  return mins > 0 ? mins : 0
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
}

// Map API event to internal shape expected by components
function mapEvent(e) {
  const task = e.task ?? null
  return {
    id:          String(e.id),
    type:        e.type,
    status:      e.status,
    lat:         e.lat,
    lng:         e.lng,
    road:        e.road ?? e.roadName ?? '',
    source:      e.source ?? e.sourceName ?? '',
    direction:   e.direction ?? null,
    reportedAgo: computeAgo(e.reportedAt ?? e.createdAt ?? e.at),
    ttlMin:      computeTtlMin(e.ttlExpiresAt),
    taskStatus:    task?.lifecycleStatus ?? e.taskStatus ?? null,
    taskInformant: task?.holderInformantId ? String(task.holderInformantId) : null,
    taskCount:     e.taskCount ?? 0,
    history: (e.history ?? []).map(h => ({
      time:  formatTime(h.changedAt ?? h.time),
      text:  h.basis ?? h.text ?? '',
      actor: h.actorType ?? null,
    })),
    // keep raw timestamps for refresh
    _reportedAt:  e.reportedAt ?? e.createdAt ?? e.at,
    _ttlExpiresAt: e.ttlExpiresAt,
  }
}

// ── store ───────────────────────────────────────────────────────────────────
export const useEventsStore = defineStore('events', () => {
  const events      = ref([])
  const selectedId  = ref(null)
  const clickPos    = ref(null)
  const filters     = ref({ types: [], statuses: [], sources: [] })
  const loading     = ref(false)
  let   _mapCursor  = null

  // ── computed ──────────────────────────────────────────────────────────────
  const selectedEvent = computed(() =>
    events.value.find(e => e.id === selectedId.value) ?? null
  )

  const filteredEvents = computed(() =>
    events.value.filter(e => {
      if (filters.value.types.length    && !filters.value.types.includes(e.type))      return false
      if (filters.value.statuses.length && !filters.value.statuses.includes(e.status)) return false
      if (filters.value.sources.length  && !filters.value.sources.includes(e.source))  return false
      return true
    })
  )

  const hasFilters = computed(() =>
    filters.value.types.length + filters.value.statuses.length + filters.value.sources.length > 0
  )

  const activeFilterLabel = computed(() => {
    const parts = []
    if (filters.value.types.length)    parts.push('類型＝' + filters.value.types.join('、'))
    if (filters.value.statuses.length) parts.push('狀態＝' + filters.value.statuses.join('、'))
    if (filters.value.sources.length)  parts.push('來源＝' + filters.value.sources.join('、'))
    return parts.join('・')
  })

  // ── API calls ─────────────────────────────────────────────────────────────
  async function loadMap() {
    loading.value = true
    try {
      const params = _mapCursor ? { since: _mapCursor } : {}
      const { data } = await client.get('/api/backend/dashboard/map', { params })

      // API returns MapEventItem[] directly
      const items = Array.isArray(data) ? data : []
      if (items.length) {
        _mapCursor = items.reduce((max, e) => (e.at > max ? e.at : max), items[0].at)
      }

      const incoming = items.map(mapEvent)
      incoming.forEach(ev => {
        const idx = events.value.findIndex(e => e.id === ev.id)
        if (idx >= 0) events.value[idx] = ev
        else events.value.push(ev)
      })
    } catch (err) {
      console.error('loadMap failed', err)
    } finally {
      loading.value = false
    }
  }

  // ── actions ───────────────────────────────────────────────────────────────
  function select(id) {
    selectedId.value = selectedId.value === id ? null : id
  }
  function clearSelection() { selectedId.value = null; clickPos.value = null }
  function setClickPos(pos) { clickPos.value = pos }
  function setFilter(key, values) { filters.value[key] = values }
  function clearFilters() { filters.value = { types: [], statuses: [], sources: [] } }
  function getById(id) { return events.value.find(e => e.id === id) ?? null }

  async function fetchEvent(id) {
    try {
      const { data } = await client.get(`/api/events/${id}`)
      const ev = mapEvent(data)
      const idx = events.value.findIndex(e => e.id === ev.id)
      if (idx >= 0) events.value[idx] = ev
      else events.value.push(ev)
    } catch (err) {
      console.error('fetchEvent failed', err)
    }
  }

  async function applyEventAction(id, action, basis) {
    const ev = events.value.find(e => e.id === id)
    if (!ev) return

    if (action === 'dispatch') {
      await client.post(`/api/backend/events/${id}/dispatch`, { note: basis })
      return
    }

    if (action === 'extend') {
      await client.post(`/api/backend/events/${id}/extend-ttl`, { minutes: 30 })
      await fetchEvent(id)
      return
    }

    const toStatus = ACTION_TO_STATUS[action]
    if (!toStatus) return

    const { data } = await client.post(`/api/events/${id}/status`, { toStatus, basis })
    ev.status = data.status
    ev.history = (data.history ?? []).map(h => ({
      time: formatTime(h.changedAt ?? h.time),
      text: h.basis ?? h.text ?? '',
    }))
  }

  return {
    events, selectedId, clickPos, loading,
    selectedEvent, filteredEvents, filters, hasFilters, activeFilterLabel,
    select, clearSelection, setClickPos, setFilter, clearFilters, getById,
    loadMap, fetchEvent, applyEventAction,
  }
})
