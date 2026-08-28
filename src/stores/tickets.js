import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

const SUBTYPE_LABELS = {
  ReputationDispute: '信譽異議',
  RemovalDispute:    '除名異議',
  General:           '一般申訴',
}

function typeLabel(ticketType, subtype) {
  if (ticketType === 'appeal') {
    const s = SUBTYPE_LABELS[subtype] ?? subtype ?? ''
    return s ? `申訴類・${s}` : '申訴'
  }
  if (ticketType === 'report')              return '用戶檢舉'
  if (ticketType === 'support')             return '一般客服'
  if (ticketType === 'redemption_support')  return '兌換相關客服'
  if (ticketType === 'change_request')      return '資料變更申請'
  return ticketType ?? '未知'
}

// 建工單 dropdown 選項：label ↔ API { ticketType, subtype }
export const TICKET_TYPE_MAP = [
  { label: '一般客服',         ticketType: 'support',            subtype: null },
  { label: '兌換相關客服',     ticketType: 'redemption_support', subtype: null },
  { label: '申訴類・信譽異議', ticketType: 'appeal',             subtype: 'ReputationDispute' },
  { label: '申訴類・除名異議', ticketType: 'appeal',             subtype: 'RemovalDispute' },
  { label: '用戶檢舉',         ticketType: 'report',             subtype: null },
]

export const TICKET_TYPES = TICKET_TYPE_MAP.map(t => t.label)

export const STATUS_LABELS = {
  Open:       '待處理',
  InProgress: '處理中',
  Resolved:   '已結案',
}
export const STATUS_VARIANTS = {
  Open:       'wait',
  InProgress: 'info',
  Resolved:   'ok',
}

export const FILTERS = [
  { label: '待處理', key: 'Open' },
  { label: '處理中', key: 'InProgress' },
  { label: '已結案', key: 'Resolved' },
  { label: '全部',   key: 'all' },
]

function formatAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小時前`
  return `${Math.floor(hrs / 24)} 天前`
}

function mapListItem(d) {
  return {
    id:          String(d.id),
    typeLabel:   typeLabel(d.ticketType, d.subtype),
    status:      d.status ?? 'Open',
    relatedType: d.relatedType ?? null,
    relatedId:   d.relatedId ?? null,
    submittedAt: formatAgo(d.createdAt),
  }
}

const ACTION_LABELS = {
  ticket_create:  '建立工單',
  ticket_claim:   '接案受理',
  ticket_resolve: '已結案',
  ticket_reject:  '已拒絕',
}

function parseHistoryEntry(h) {
  const label = ACTION_LABELS[h.action] ?? h.action ?? ''
  let detail = ''
  try {
    const obj = h.detail ? JSON.parse(h.detail) : {}
    if (obj.resolution) detail = `：${obj.resolution}`
    else if (obj.reason) detail = `：${obj.reason}`
  } catch {}
  return {
    time:  h.time  ?? '',
    text:  label + detail,
    actor: h.actor ?? null,
    done:  true,
  }
}

function mapDetail(d) {
  return {
    id:          String(d.id),
    typeLabel:   typeLabel(d.ticketType, d.subtype),
    status:      d.status ?? 'Open',
    content:     d.content ?? '',
    submitterId: d.submitterId ?? null,
    relatedType: d.relatedType ?? null,
    relatedId:   d.relatedId ?? null,
    resolution:  d.resolution ?? null,
    submittedAt: formatAgo(d.createdAt),
    resolvedAt:  d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString('zh-TW') : null,
    history:     (d.history ?? []).map(parseHistoryEntry),
  }
}

export const useTicketsStore = defineStore('tickets', () => {
  const tickets      = ref([])
  const _cache       = reactive({})
  const selectedId   = ref(null)
  const filterStatus = ref('all')

  const filteredTickets = computed(() => {
    if (filterStatus.value === 'all') return tickets.value
    return tickets.value.filter(t => t.status === filterStatus.value)
  })

  const selectedTicket = computed(() =>
    selectedId.value
      ? (_cache[selectedId.value] ?? tickets.value.find(t => t.id === selectedId.value) ?? null)
      : null
  )

  async function load(type) {
    try {
      const params = type ? `?type=${type}` : ''
      const { data } = await client.get(`/api/backend/tickets${params}`)
      tickets.value = data.map(mapListItem)
      if (tickets.value.length && !selectedId.value) {
        select(tickets.value[0].id)
      }
    } catch (err) {
      console.error('tickets load failed', err)
    }
  }

  async function fetchDetail(id) {
    try {
      const { data } = await client.get(`/api/backend/tickets/${id}`)
      _cache[id] = mapDetail(data)
    } catch (err) {
      console.error('ticket fetchDetail failed', err)
    }
  }

  function select(id) {
    selectedId.value = id
    if (!_cache[id]) fetchDetail(id)
  }

  function setFilter(key) {
    filterStatus.value = key
  }

  async function addTicket(draft) {
    const typeDef = TICKET_TYPE_MAP.find(t => t.label === draft.type)
      ?? { ticketType: 'support', subtype: null }

    const relatedType = draft.relatedEventId?.trim() ? 'Event' : null
    const relatedId   = draft.relatedEventId?.trim()
      ? (parseInt(draft.relatedEventId.replace(/\D/g, ''), 10) || null)
      : null

    const { data } = await client.post('/api/backend/tickets', {
      ticketType:  typeDef.ticketType,
      subtype:     typeDef.subtype,
      content:     draft.description,
      relatedType,
      relatedId,
      channel:     'Backend',
    })
    const newItem = mapListItem(data)
    tickets.value.unshift(newItem)
    _cache[newItem.id] = mapDetail(data)
    selectedId.value = newItem.id
  }

  async function applyAction(id, action, reason) {
    if (action === 'accept') {
      await client.post(`/api/backend/tickets/${id}/claim`)
      _patchStatus(id, 'InProgress')
    } else if (action === 'close') {
      await client.post(`/api/backend/tickets/${id}/resolve`, { resolution: reason })
      _patchStatus(id, 'Resolved')
      if (_cache[id]) _cache[id].resolution = reason
    } else if (action === 'reply') {
      if (_cache[id]) {
        _cache[id].history.push({
          time:  new Date().toLocaleString('zh-TW').slice(0, 16),
          text:  `回覆：${reason}`,
          actor: '後台人員',
        })
      }
    }
  }

  function _patchStatus(id, status) {
    if (_cache[id]) _cache[id].status = status
    const item = tickets.value.find(t => t.id === id)
    if (item) item.status = status
  }

  return {
    tickets, selectedId, filterStatus,
    filteredTickets, selectedTicket,
    load, select, setFilter, addTicket, applyAction,
  }
})
