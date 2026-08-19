import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

function formatAgo(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1)  return '剛剛'
  if (mins < 60) return `${mins} 分鐘前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} 小時前`
  return `${Math.floor(hrs / 24)} 天前`
}

// ticketType 使用 API 文件 3.5 定義的小寫值：appeal / report / change_request
const SUBTYPE_LABELS = {
  ReputationDispute: '信譽異議',
  RemovalDispute:    '除名異議',
  General:           '一般申訴',
}

function typeLabel(ticketType, subtype) {
  const sub = SUBTYPE_LABELS[subtype] ?? subtype ?? ''
  if (ticketType === 'appeal') return sub ? `申訴類・${sub}` : '申訴'
  return ticketType ? `${ticketType}${sub ? '・' + sub : ''}` : sub || '—'
}

function mapListItem(d) {
  return {
    id:          String(d.id),
    typeLabel:   typeLabel(d.ticketType, d.subtype),
    status:      d.status ?? '',   // Open / InProgress / Resolved
    relatedType: d.relatedType ?? null,
    relatedId:   d.relatedId ?? null,
    submittedAt: formatAgo(d.createdAt),
  }
}

function mapDetail(d) {
  return {
    id:            String(d.id),
    typeLabel:     typeLabel(d.ticketType, d.subtype),
    ticketType:    d.ticketType ?? '',
    subtype:       d.subtype ?? '',
    status:        d.status ?? '',
    content:       d.content ?? '',
    submitterType: d.submitterType ?? '',
    submitterId:   d.submitterId ?? null,
    relatedType:   d.relatedType ?? null,
    relatedId:     d.relatedId ?? null,
    resolution:    d.resolution ?? null,
    submittedAt:   formatAgo(d.createdAt),
    resolvedAt:    d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString('zh-TW') : null,
    // TODO(後端): TicketResponse 無 history/audit_log 欄位，審理歷程暫不可用
    history: [],
    result: null,  // client-side only: 'upheld' | 'rejected' | null
  }
}

export const useAppealsStore = defineStore('appeals', () => {
  const tickets      = ref([])
  const _cache       = reactive({})
  const filterStatus = ref('all')
  const selectedId   = ref(null)
  const loading      = ref(false)

  const filteredAppeals = computed(() => {
    if (filterStatus.value === 'all') return tickets.value
    return tickets.value.filter(t => t.status === filterStatus.value)
  })

  const selectedAppeal = computed(() => _cache[selectedId.value] ?? null)

  function setFilter(key) { filterStatus.value = key }

  async function select(id) {
    selectedId.value = id
    if (id && !_cache[id]) {
      try {
        const { data } = await client.get(`/api/backend/tickets/${id}`)
        _cache[id] = mapDetail(data)
      } catch (err) {
        console.error('fetchTicket failed', err)
      }
    }
  }

  async function load() {
    loading.value = true
    try {
      const { data } = await client.get('/api/backend/tickets', { params: { type: 'appeal' } })
      tickets.value = data.map(mapListItem)
      if (!selectedId.value && tickets.value.length) select(tickets.value[0].id)
    } catch (err) {
      console.error('load appeals failed', err)
    } finally {
      loading.value = false
    }
  }

  async function applyAction(id, action, reason) {
    if (action === 'accept') {
      await client.post(`/api/backend/tickets/${id}/claim`)
    } else {
      const prefix = action === 'uphold' ? 'upheld' : 'rejected'
      await client.post(`/api/backend/tickets/${id}/resolve`, { resolution: `${prefix}:${reason}` })
    }
    if (_cache[id]) {
      if (action === 'accept') {
        _cache[id].status = 'InProgress'
      } else {
        _cache[id].status = 'Resolved'
        _cache[id].result = action === 'uphold' ? 'upheld' : 'rejected'
        _cache[id].resolution = `${action === 'uphold' ? 'upheld' : 'rejected'}:${reason}`
      }
    }
    const listItem = tickets.value.find(t => t.id === id)
    if (listItem) listItem.status = action === 'accept' ? 'InProgress' : 'Resolved'
  }

  return {
    tickets, filterStatus, selectedId, filteredAppeals, selectedAppeal, loading,
    setFilter, select, load, applyAction,
  }
})
