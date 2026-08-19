import { ref, computed } from 'vue'
import { defineStore }   from 'pinia'
import client from '../api/client'

export const ROLE_LABELS = {
  Admin:    '管理員',
  Operator: '營運員',
}

// BackendStatus enum
export const STATUS_LABELS_ACCOUNT = {
  Active:   '啟用',
  Disabled: '停用',
}

export const ACTION_TYPES = [
  '事件確認', '誤報下架', '申訴裁決', '兌換核銷',
  '資格審核', '系統參數修改', '規則設定修改',
  '帳號新增', '帳號停用', '帳號管理', '靜態資料修改',
]

export const ACTION_CHIP_CLASS = {
  '系統參數修改': 'chip-warn',
  '規則設定修改': 'chip-warn',
  '帳號新增':    'chip-info',
  '帳號停用':    'chip-danger',
  '帳號管理':    'chip-info',
  '資格審核':    'chip-accent',
  '申訴裁決':    'chip-accent',
  '事件確認':    'chip-ok',
  '誤報下架':    'chip-ok',
  '兌換核銷':    'chip-ok',
  '靜態資料修改': 'chip-secondary',
}

function mapAccount(d) {
  return {
    id:          String(d.id),
    username:    d.username ?? '',
    role:        d.role ?? 'Operator',
    status:      d.status ?? 'Active',
    lastLoginAt: d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleDateString('zh-TW') : null,
    createdAt:   d.createdAt ? d.createdAt.slice(0, 10) : '',
  }
}

function mapAuditItem(d) {
  return {
    id:         String(d.id),
    time:       d.at ? new Date(d.at).toLocaleString('zh-TW', { hour12: false }) : '',
    operatorId: d.actorId != null ? String(d.actorId) : (d.actorType ?? ''),
    actionType: d.action ?? '',
    target:     d.targetId != null ? String(d.targetId) : (d.targetType ?? ''),
    detail:     d.detail ?? '',
    ip:         '',    // TODO(後端): AuditItem 不含 IP 欄位
  }
}

export const useAccountsStore = defineStore('accounts', () => {
  const adminAccounts = ref([])
  const auditLog      = ref([])

  const filterState = ref({ operatorId: '', actionType: 'all', dateFrom: '', dateTo: '' })

  const filteredLog = computed(() => {
    const { operatorId, actionType, dateFrom, dateTo } = filterState.value
    return auditLog.value.filter(r => {
      if (operatorId && !r.operatorId.toLowerCase().includes(operatorId.toLowerCase())) return false
      if (actionType !== 'all' && r.actionType !== actionType) return false
      const d = r.time.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo   && d > dateTo)   return false
      return true
    })
  })

  async function loadAccounts() {
    try {
      const { data } = await client.get('/api/backend/accounts')
      adminAccounts.value = data.map(mapAccount)
    } catch (err) {
      console.error('loadAccounts failed', err)
    }
  }

  async function loadAuditLog(params = {}) {
    try {
      const qs = new URLSearchParams()
      if (params.actorType)  qs.set('actorType', params.actorType)
      if (params.action)     qs.set('action', params.action)
      if (params.targetType) qs.set('targetType', params.targetType)
      if (params.targetId)   qs.set('targetId', params.targetId)
      qs.set('limit', params.limit ?? 50)
      const { data } = await client.get(`/api/backend/audit?${qs}`)
      auditLog.value = data.map(mapAuditItem)
    } catch (err) {
      console.error('loadAuditLog failed', err)
    }
  }

  function setFilter(key, val) { filterState.value[key] = val }

  async function addAccount(data) {
    const { reason, ...rest } = data
    const { data: created } = await client.post('/api/backend/accounts', {
      username: rest.username,
      password: rest.password,
      role:     rest.role,
    })
    adminAccounts.value.push(mapAccount(created))
  }

  async function updateAccount(id, patch) {
    const { reason, ...rest } = patch
    const payload = {}
    if (rest.role     != null) payload.role     = rest.role
    if (rest.status   != null) payload.status   = rest.status
    if (rest.password != null) payload.newPassword = rest.password
    const { data: updated } = await client.put(`/api/backend/accounts/${id}`, payload)
    const idx = adminAccounts.value.findIndex(a => a.id === id)
    if (idx !== -1) adminAccounts.value[idx] = mapAccount(updated)
  }

  return {
    adminAccounts, auditLog,
    filterState, filteredLog,
    setFilter, loadAccounts, loadAuditLog, addAccount, updateAccount,
  }
})
