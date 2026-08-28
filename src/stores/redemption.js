import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import client from '../api/client'

// RedemptionStatus enum → 本地顯示鍵（component 直接用 API 值）
export const STATUS_LABELS = {
  Applied:       '申請中',
  PendingReview: '待核對',
  Reserved:      '已核對（凍結中）',
  Disbursed:     '已發放・待扣除',
  Deducted:      '已結清',
  Rejected:      '已拒',
  Held:          '掛起（停權）',
  OwnerDenied:   '本人否認',
}
export const STATUS_VARIANTS = {
  Applied:       'wait',
  PendingReview: 'wait',
  Reserved:      'checked',
  Disbursed:     'issued',
  Deducted:      'ok',
  Rejected:      'danger',
  Held:          'hold',
  OwnerDenied:   'danger',
}

export const SOURCE_LABELS = {
  Form:       '表單（兌換中心）',
  LineManual: 'LINE 代收',
}

export const FILTERS = [
  { label: '待核對', key: 'PendingReview' },
  { label: '已核對', key: 'Reserved' },
  { label: '已發放', key: 'Disbursed' },
  { label: '掛起',   key: 'Held' },
  { label: '全部',   key: 'all' },
]

function mapOrder(d) {
  const ib = d.informantBalance ?? {}
  return {
    id:           String(d.id),
    status:       d.status ?? 'PendingReview',
    source:       SOURCE_LABELS[d.source] ?? d.source ?? '',
    informantId:  d.informantId ?? null,
    informantNo:  d.informantNo ?? null,
    amountPoints: d.amountPoints ?? 0,
    items:        d.items ?? '',
    voucherInfo:  d.voucherInfo ?? null,
    createdAt:    d.createdAt ? new Date(d.createdAt).toLocaleString('zh-TW') : '',
    time:         d.createdAt ? new Date(d.createdAt).toLocaleString('zh-TW') : '',
    disbursedAt:  d.disbursedAt ? new Date(d.disbursedAt).toLocaleString('zh-TW') : null,
    // 以下欄位由 GET /api/backend/redemptions/{id} 明細端點回傳（後端補充文件）
    limitCheck:    d.limitCheck ?? null,
    deniedByOwner: d.deniedByOwner ?? false,
    informantBalance: {
      available: ib.available ?? null,
      frozen:    ib.frozen ?? null,
      deferred:  ib.deferred ?? null,
    },
  }
}

export const useRedemptionStore = defineStore('redemption', () => {
  const orders      = ref([])
  const _cache      = reactive({})
  const selectedId  = ref(null)
  const filterState = ref('all')

  const filteredOrders = computed(() => {
    if (filterState.value === 'all') return orders.value
    return orders.value.filter(o => o.status === filterState.value)
  })

  const selectedOrder = computed(() =>
    selectedId.value
      ? (_cache[selectedId.value] ?? orders.value.find(o => o.id === selectedId.value) ?? null)
      : null
  )

  async function load(status) {
    try {
      const params = status && status !== 'all' ? `?status=${status}` : ''
      const { data } = await client.get(`/api/backend/redemptions${params}`)
      orders.value = data.map(mapOrder)
      if (orders.value.length && !selectedId.value) {
        select(orders.value[0].id)
      }
    } catch (err) {
      console.error('redemption load failed', err)
    }
  }

  async function fetchDetail(id) {
    try {
      const { data } = await client.get(`/api/backend/redemptions/${id}`)
      _cache[id] = mapOrder(data)
    } catch (err) {
      console.error('redemption fetchDetail failed', err)
    }
  }

  function select(id) {
    selectedId.value = id
    if (!_cache[id]) fetchDetail(id)
  }

  function setFilter(key) {
    filterState.value = key
  }

  async function applyAction(orderId, action, reason) {
    const id = orderId
    if (action === 'confirm') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/verify`)
      _patchStatus(id, 'Reserved', data)
    } else if (action === 'reject') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/reject`, { reason })
      _patchStatus(id, 'Rejected', data)
    } else if (action === 'fillVoucher') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/disburse`, { voucherInfo: reason })
      _patchStatus(id, 'Disbursed', data)
      if (_cache[id]) _cache[id].voucherInfo = reason
    } else if (action === 'failBack') {
      // 規格確認：reject 端點已涵蓋「發放失敗」情境（已核對者解凍 frozen→available），結果狀態為 Rejected
      const { data } = await client.post(`/api/backend/redemptions/${id}/reject`, { reason })
      _patchStatus(id, 'Rejected', data)
    } else if (action === 'deduct') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/deduct`)
      _patchStatus(id, 'Deducted', data)
    } else if (action === 'rejectHeld') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/reject`, { reason })
      _patchStatus(id, 'Rejected', data)
    }
  }

  function _patchStatus(id, status, apiData) {
    if (_cache[id]) {
      _cache[id].status = status
      if (apiData) Object.assign(_cache[id], mapOrder(apiData))
    }
    const item = orders.value.find(o => o.id === id)
    if (item) item.status = status
  }

  return {
    orders, selectedId, selectedOrder, filteredOrders, filterState,
    load, select, setFilter, applyAction,
  }
})
