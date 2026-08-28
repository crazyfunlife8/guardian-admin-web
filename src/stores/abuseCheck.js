import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import client, { BASE_URL } from '../api/client'

// 規則分組元資料（UI 層資料，key 對應 params store 參數鍵）
export const RULE_GROUP_META = [
  { key: 'exclusion', label: '關聯排除規則' },
  { key: 'fake',      label: '單人作假偵測規則' },
  { key: 'freq',      label: '單裝置回報頻率上限' },
]

// 反濫用規則的 PARAM_DEFS（與 params.js 同源，從此分開維護反濫用子集）
const RULE_DEFS = [
  { key: 'excl_same_bank',    group: 'exclusion', type: 'toggle', label: '同收款帳戶排除',     description: '同一收款帳戶綁定的情報員觸發任務時，廣播過濾排除彼此', defaultValue: 1, unit: '' },
  { key: 'excl_same_device',  group: 'exclusion', type: 'toggle', label: '同裝置排除',          description: '同一裝置識別碼曾登入多帳號時，廣播過濾排除共用裝置帳號', defaultValue: 1, unit: '' },
  { key: 'excl_high_cooccur', group: 'exclusion', type: 'toggle', label: '高頻共同出沒排除',    description: '情報員間共同出沒次數超過統計閾值時，廣播過濾視為潛在關聯方', defaultValue: 0, unit: '' },
  { key: 'fake_sim_location', group: 'fake',      type: 'toggle', label: '模擬定位偵測',         description: '裝置 GPS 軌跡特徵符合模擬器行為時自動標記', defaultValue: 1, unit: '' },
  { key: 'location_jump_km',  group: 'fake',      label: '位置跳躍閾值',   description: '相鄰兩筆回報的直線距離超過此值，觸發位置跳躍標記', defaultValue: 10, unit: '公里' },
  { key: 'fake_dwell_minutes', group: 'fake',     label: '停留時間窗閾值', description: '回報位置停留時間低於此值視為異常', defaultValue: 2, unit: '分鐘' },
  { key: 'fake_ratio_pct',    group: 'fake',      label: '單人作假佐證比率', description: '情報員回報與用戶反饋不符的比率超過此值，進入人工覆核佇列', defaultValue: 40, unit: '%' },
  { key: 'high_freq_count',   group: 'freq',      label: '高頻回報閾值（次數）', description: '同一裝置在時間窗口內達此回報次數，觸發高頻回報警示', defaultValue: 5, unit: '次' },
  { key: 'high_freq_minutes', group: 'freq',      label: '高頻回報閾值（時間窗口）', description: '計算高頻回報次數的時間窗口長度', defaultValue: 30, unit: '分鐘' },
]

function mapObservation(d) {
  const time = d.observedAt ? new Date(d.observedAt).toLocaleString('zh-TW') : ''
  return {
    id:                   String(d.id),
    canonicalEventId:     d.canonicalEventId ?? null,
    reporterInformantId:  d.reporterInformantId ?? null,
    informantId:          d.reporterInformantId ? String(d.reporterInformantId) : null,
    taskId:               d.taskId ?? null,
    rawFields:            d.rawFields ?? '',
    rule:                 d.rawFields ?? '',
    observedAt:           time,
    triggeredAt:          time,
    status:               'pending',
    evidence:             (d.evidence ?? []).map(e => ({
      id:            String(e.id),
      evidenceType:  e.evidenceType,
      createdAt:     e.createdAt ? new Date(e.createdAt).toLocaleString('zh-TW') : '',
    })),
    evidenceSkipped:      d.evidenceSkipped ?? false,
  }
}

export const useAbuseCheckStore = defineStore('abuseCheck', () => {
  const caseList    = ref([])
  const ruleList    = ref(RULE_DEFS.map(r => ({ ...r, value: r.defaultValue, history: [] })))
  const pairingList = ref([])

  const filterStatus = ref('all')
  const selectedId   = ref(null)
  const reportFilter = ref({ informantId: '' })

  const filteredCases = computed(() => {
    const f = filterStatus.value
    if (f === 'all') return caseList.value
    return caseList.value.filter(c => c.status === f)
  })

  const selectedCase = computed(() =>
    caseList.value.find(c => c.id === selectedId.value) ?? null
  )

  const pendingCount = computed(() =>
    caseList.value.filter(c => c.status === 'pending').length
  )

  const ruleMap = computed(() =>
    Object.fromEntries(ruleList.value.map(r => [r.key, r]))
  )

  function rulesInGroup(groupKey) {
    return ruleList.value.filter(r => r.group === groupKey)
  }

  const filteredReports = computed(() => {
    const { informantId } = reportFilter.value
    if (!informantId.trim()) return caseList.value
    const q = informantId.trim().toLowerCase()
    return caseList.value.filter(c =>
      String(c.informantId ?? c.reporterInformantId ?? '').toLowerCase().includes(q)
    )
  })

  async function loadObservations() {
    try {
      const { data } = await client.get('/api/backend/abuse/suspicious-observations')
      caseList.value = data.map(mapObservation)
      if (caseList.value.length && !selectedId.value) {
        selectedId.value = caseList.value[0].id
      }
    } catch (err) {
      console.error('loadObservations failed', err)
    }
  }

  async function loadPairingReport(threshold = 3) {
    try {
      const { data } = await client.get(`/api/backend/abuse/pairing-report?threshold=${threshold}`)
      pairingList.value = Array.isArray(data) ? data : (data.pairs ?? [])
    } catch (err) {
      console.error('loadPairingReport failed', err)
    }
  }

  function setFilter(key) { filterStatus.value = key }
  function select(id)     { selectedId.value = id }

  async function applyCaseAction(id, action, reason) {
    const accept = action === 'confirm'
    await client.post(`/api/backend/abuse/suspicious-observations/${id}/review`, {
      accept,
      basis: reason,
    })
    const c = caseList.value.find(c => c.id === id)
    if (c) {
      c.status = accept ? 'confirmed' : 'cleared'
    }
  }

  async function updateRule(key, value, reason) {
    const rule = ruleList.value.find(r => r.key === key)
    if (!rule) return
    const oldValue = rule.value
    // OpenAPI: body 為 raw JSON 數值，同 params.js 修正
    await client.put(`/api/backend/parameters/${key}`, Number(value))
    rule.value = Number(value)
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    rule.history.push({ time: now, from: oldValue, to: Number(value), reason, actor: '後台人員' })
  }

  async function blockDevice(deviceUid, reason = '') {
    await client.post(`/api/backend/abuse/devices/${deviceUid}/block`, { reason })
  }

  async function unblockDevice(deviceUid) {
    await client.post(`/api/backend/abuse/devices/${deviceUid}/unblock`)
  }

  async function releaseDeviceLink(id, reason = '') {
    await client.post(`/api/backend/abuse/device-links/${id}/release`, { reason })
  }

  async function fetchEvidenceFile(taskId, evidenceId) {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(
      `${BASE_URL}/api/backend/tasks/${taskId}/evidence/${evidenceId}/file`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) throw new Error(`${res.status}`)
    const blob = await res.blob()
    return { url: URL.createObjectURL(blob), isImage: blob.type.startsWith('image/') }
  }

  return {
    caseList, ruleList, pairingList, filterStatus, selectedId, reportFilter,
    filteredCases, selectedCase, pendingCount, ruleMap, filteredReports,
    setFilter, select, applyCaseAction, updateRule, rulesInGroup,
    loadObservations, loadPairingReport, blockDevice, unblockDevice, releaseDeviceLink,
    fetchEvidenceFile,
  }
})
