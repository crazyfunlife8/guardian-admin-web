import { ref, computed } from 'vue'
import { defineStore }   from 'pinia'

export const ROLE_LABELS = {
  admin: '管理員',
  ops:   '營運員',
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

export const useAccountsStore = defineStore('accounts', () => {
  const adminAccounts = ref([
    { id: 'ADM-001', displayName: '管理員甲', role: 'admin', status: 'active', createdAt: '2025-01-01' },
    { id: 'ADM-002', displayName: '北區營運員', role: 'ops',   status: 'active', createdAt: '2025-03-15' },
    { id: 'ADM-003', displayName: '值班員甲',   role: 'ops',   status: 'active', createdAt: '2025-06-01' },
  ])

  const auditLog = ref([
    { id: 'LOG-001', time: '2026-07-22 09:15:30', operatorId: 'ADM-001', actionType: '系統參數修改', target: 'inspection_ttl',    reason: '運營調整', ip: '192.168.1.10' },
    { id: 'LOG-002', time: '2026-07-22 09:32:11', operatorId: 'ADM-002', actionType: '事件確認',    target: 'EV-003',           reason: '內部查核', ip: '192.168.1.22' },
    { id: 'LOG-003', time: '2026-07-22 10:05:44', operatorId: 'ADM-002', actionType: '資格審核',    target: 'AP-0004',          reason: '標準審核', ip: '192.168.1.22' },
    { id: 'LOG-004', time: '2026-07-22 10:18:07', operatorId: 'ADM-003', actionType: '兌換核銷',    target: 'RD-0002',          reason: '核對成立', ip: '192.168.1.35' },
    { id: 'LOG-005', time: '2026-07-22 11:02:33', operatorId: 'ADM-001', actionType: '帳號管理',    target: 'ADM-004',          reason: '人事異動', ip: '192.168.1.10' },
    { id: 'LOG-006', time: '2026-07-22 11:45:19', operatorId: 'ADM-001', actionType: '規則設定修改', target: 'high_freq_count',  reason: '安全政策', ip: '192.168.1.10' },
    { id: 'LOG-007', time: '2026-07-22 13:10:05', operatorId: 'ADM-002', actionType: '申訴裁決',    target: 'AP5-002',          reason: '調查核實', ip: '192.168.1.22' },
    { id: 'LOG-008', time: '2026-07-22 13:28:50', operatorId: 'ADM-003', actionType: '誤報下架',    target: 'EV-001',           reason: '多方反饋', ip: '192.168.1.35' },
    { id: 'LOG-009', time: '2026-07-21 15:33:22', operatorId: 'ADM-001', actionType: '帳號新增',    target: 'ADM-003',          reason: '人事異動', ip: '192.168.1.10' },
    { id: 'LOG-010', time: '2026-07-21 16:00:01', operatorId: 'ADM-002', actionType: '靜態資料修改', target: 'HS-001',           reason: '實地勘測', ip: '192.168.1.22' },
    { id: 'LOG-011', time: '2026-07-21 16:44:17', operatorId: 'ADM-003', actionType: '兌換核銷',    target: 'RD-0003',          reason: '核對成立', ip: '192.168.1.35' },
    { id: 'LOG-012', time: '2026-07-21 17:05:40', operatorId: 'ADM-001', actionType: '系統參數修改', target: 'broadcast_radius_1', reason: '運營調整', ip: '192.168.1.10' },
    { id: 'LOG-013', time: '2026-07-20 09:22:15', operatorId: 'ADM-002', actionType: '資格審核',    target: 'AP-0002',          reason: '標準審核', ip: '192.168.1.22' },
    { id: 'LOG-014', time: '2026-07-20 10:11:38', operatorId: 'ADM-001', actionType: '帳號停用',    target: 'ADM-004',          reason: '安全考量', ip: '192.168.1.10' },
    { id: 'LOG-015', time: '2026-07-20 14:58:03', operatorId: 'ADM-003', actionType: '申訴裁決',    target: 'AP5-001',          reason: '規則判定', ip: '192.168.1.35' },
  ])

  let _accSeq = 5
  let _logSeq = 16

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

  function setFilter(key, val) { filterState.value[key] = val }

  function addAccount(data) {
    const id = `ADM-00${_accSeq++}`
    const { reason, password: _pw, ...rest } = data
    adminAccounts.value.push({ id, ...rest, createdAt: new Date().toISOString().slice(0, 10) })
    _pushLog('帳號新增', id, reason ?? '人事異動')
  }

  function updateAccount(id, patch) {
    const acc = adminAccounts.value.find(a => a.id === id)
    if (!acc) return
    const { reason, ...rest } = patch
    Object.assign(acc, rest)
    const actionType = rest.status === 'inactive' ? '帳號停用' : '帳號管理'
    _pushLog(actionType, id, reason ?? '人事異動')
  }

  function _pushLog(actionType, target, reason) {
    const id = `LOG-${String(_logSeq++).padStart(3, '0')}`
    const time = new Date().toLocaleString('sv-SE').replace('T', ' ')
    auditLog.value.unshift({ id, time, operatorId: 'ADM-001', actionType, target, reason, ip: '192.168.1.10' })
  }

  return {
    adminAccounts, auditLog,
    filterState, filteredLog,
    setFilter, addAccount, updateAccount,
  }
})
