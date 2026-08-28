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
  'EventConfirm', 'FalseReportRemove', 'AppealResolve', 'RedemptionSettle',
  'QualificationReview', 'SystemParamUpdate', 'RuleUpdate',
  'AccountCreate', 'AccountDisable', 'AccountUpdate', 'StaticDataUpdate',
]

export const ACTION_TYPE_LABELS = {
  EventConfirm:        '事件確認',
  FalseReportRemove:   '誤報下架',
  AppealResolve:       '申訴裁決',
  RedemptionSettle:    '兌換核銷',
  QualificationReview: '資格審核',
  SystemParamUpdate:   '系統參數修改',
  RuleUpdate:          '規則設定修改',
  AccountCreate:       '帳號新增',
  AccountDisable:      '帳號停用',
  AccountUpdate:       '帳號管理',
  StaticDataUpdate:    '靜態資料修改',
}

export const ACTION_CHIP_CLASS = {
  SystemParamUpdate:   'chip-warn',
  RuleUpdate:          'chip-warn',
  AccountCreate:       'chip-info',
  AccountDisable:      'chip-danger',
  AccountUpdate:       'chip-info',
  QualificationReview: 'chip-accent',
  AppealResolve:       'chip-accent',
  EventConfirm:        'chip-ok',
  FalseReportRemove:   'chip-ok',
  RedemptionSettle:    'chip-ok',
  StaticDataUpdate:    'chip-secondary',
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
