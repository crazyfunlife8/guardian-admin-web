import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// eventType: inspection | accident | construction | control
// status: unverified | verified | cleared
const MOCK_EVENTS = [
  {
    id: 'E-30771', type: 'inspection', status: 'unverified',
    road: '環河南路二段（北向）', source: '用戶反饋',
    reportedAgo: '3 分鐘前', ttlMin: 41, taskStatus: '廣播中',
    x: '58.5%', y: '35%',
    history: [
      { time: '22:44', text: '建立（用戶反饋・未確認）' },
      { time: '22:45', text: '驗證任務廣播（半徑 2 檔・系統）' },
    ],
  },
  {
    id: 'E-30769', type: 'inspection', status: 'verified',
    road: '堤頂大道（南向）', source: '情報網',
    reportedAgo: '18 分鐘前', ttlMin: 26, taskStatus: '已接',
    x: '33%', y: '52.5%',
    history: [
      { time: '22:30', text: '建立（情報網・未確認）' },
      { time: '22:32', text: '驗證任務廣播' },
      { time: '22:33', text: '情報員 GI-0042 接單・鎖定 15 分' },
      { time: '22:35', text: '升已驗證' },
    ],
  },
  {
    id: 'E-30768', type: 'accident', status: 'verified',
    road: '市民高架（東向）', source: '感測',
    reportedAgo: '21 分鐘前', ttlMin: 39, taskStatus: null,
    x: '73%', y: '62%',
    history: [
      { time: '22:26', text: '建立（感測・未確認）' },
      { time: '22:27', text: '感測佐證印證・升已驗證' },
    ],
  },
  {
    id: 'E-30755', type: 'construction', status: 'verified',
    road: '重慶北路三段', source: '合作通報',
    reportedAgo: '2 小時前', ttlMin: 118, taskStatus: null,
    x: '21%', y: '30%',
    history: [
      { time: '20:42', text: '建立（合作通報・已驗證）' },
    ],
  },
  {
    id: 'E-30760', type: 'control', status: 'unverified',
    road: '基隆路一段', source: '用戶反饋',
    reportedAgo: '55 分鐘前', ttlMin: 5, taskStatus: '逾時',
    x: '66%', y: '20%',
    history: [
      { time: '21:52', text: '建立（用戶反饋・未確認）' },
      { time: '21:54', text: '驗證任務廣播' },
      { time: '22:09', text: '逾時無人接・半徑放大第 1 檔' },
      { time: '22:24', text: '逾時無人接・半徑放大第 2 檔' },
    ],
  },
]

export const useEventsStore = defineStore('events', () => {
  const events = ref([...MOCK_EVENTS])
  const selectedId = ref('E-30771')
  const filters = ref({ types: [], statuses: [], sources: [] })

  const selectedEvent = computed(() =>
    events.value.find(e => e.id === selectedId.value) ?? null
  )

  const filteredEvents = computed(() => {
    return events.value.filter(e => {
      if (filters.value.types.length && !filters.value.types.includes(e.type)) return false
      if (filters.value.statuses.length && !filters.value.statuses.includes(e.status)) return false
      if (filters.value.sources.length && !filters.value.sources.includes(e.source)) return false
      return true
    })
  })

  function select(id) { selectedId.value = selectedId.value === id ? null : id }
  function clearSelection() { selectedId.value = null }
  function setFilter(key, values) { filters.value[key] = values }
  function clearFilters() { filters.value = { types: [], statuses: [], sources: [] } }

  const hasFilters = computed(() =>
    filters.value.types.length + filters.value.statuses.length + filters.value.sources.length > 0
  )

  const activeFilterLabel = computed(() => {
    const parts = []
    if (filters.value.types.length) parts.push('類型＝' + filters.value.types.join('、'))
    if (filters.value.statuses.length) parts.push('狀態＝' + filters.value.statuses.join('、'))
    if (filters.value.sources.length) parts.push('來源＝' + filters.value.sources.join('、'))
    return parts.join('・')
  })

  function getById(id) {
    return events.value.find(e => e.id === id) ?? null
  }

  function applyEventAction(id, action, reason) {
    const ev = events.value.find(e => e.id === id)
    if (!ev) return
    const now = new Date()
    const t = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
    const actor = 'OP-07'

    const TRANSITIONS = {
      confirm:  { from: ['unverified'],          to: 'verified',  text: '人工確認為真' },
      takedown: { from: ['unverified'],          to: 'cleared',   text: '誤報下架' },
      resolve:  { from: ['verified'],            to: 'cleared',   text: '標記已解除' },
      extend:   { from: ['unverified','verified'], to: null,      text: 'TTL 延長 30 分' },
      dispatch: { from: ['unverified','verified'], to: null,      text: '轉內部派遣' },
    }
    const tr = TRANSITIONS[action]
    if (!tr || !tr.from.includes(ev.status)) return

    if (tr.to) ev.status = tr.to
    if (action === 'extend') ev.ttlMin = (ev.ttlMin ?? 0) + 30
    ev.history.push({ time: t, text: `${tr.text}（依據：${reason}）`, actor, done: true })
  }

  return { events, selectedId, selectedEvent, filteredEvents, filters, hasFilters, activeFilterLabel,
           select, clearSelection, setFilter, clearFilters, getById, applyEventAction }
})
