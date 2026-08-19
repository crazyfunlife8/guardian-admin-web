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
}
export const STATUS_VARIANTS = {
  Applied:       'wait',
  PendingReview: 'wait',
  Reserved:      'checked',
  Disbursed:     'issued',
  Deducted:      'ok',
  Rejected:      'danger',
  Held:          'hold',
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
  return {
    id:          String(d.id),
    status:      d.status ?? 'PendingReview',
    source:      SOURCE_LABELS[d.source] ?? d.source ?? '',
    informantId: d.informantId ?? null,   // int64；OP-4 路由用
    amountPoints: d.amountPoints ?? 0,
    items:       d.items ?? '',           // JSON string；可嘗試 JSON.parse 顯示
    voucherInfo: d.voucherInfo ?? null,
    createdAt:   d.createdAt ? new Date(d.createdAt).toLocaleString('zh-TW') : '',
    disbursedAt: d.disbursedAt ? new Date(d.disbursedAt).toLocaleString('zh-TW') : null,
    history:     [],   // TODO(後端): RedemptionResponse 不含歷程，前端只記本次操作
    // 以下欄位 API 未提供，待後端在兌換明細端點補充
    balance:       null,   // TODO(後端): 需要另行呼叫情報員餘額端點
    frozen:        null,
    deferred:      null,
    accountStatus: null,   // TODO(後端): 情報員帳號狀態
    maskedAccount: null,   // TODO(後端): 遮罩收款帳戶
    realAccount:   null,
    limitCheck:    null,   // TODO(後端): 單筆上限驗算
    denialStatus:  null,   // TODO(後端): 本人否認標記
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
      // 發放失敗解凍：重新呼叫 verify 是不對的；可能需後端另加端點
      // 暫時用 reject 端點（需後端確認）
      const { data } = await client.post(`/api/backend/redemptions/${id}/reject`, { reason: `failBack: ${reason}` })
      _patchStatus(id, 'PendingReview', data)
    } else if (action === 'deduct') {
      const { data } = await client.post(`/api/backend/redemptions/${id}/deduct`)
      _patchStatus(id, 'Deducted', data)
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
