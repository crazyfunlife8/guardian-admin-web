import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TRANSITIONS = {
  confirm: { from: ['pending'], to: 'confirmed', text: '確認違規，執行停權' },
  clear:   { from: ['pending'], to: 'cleared',   text: '誤判解除，撤銷警示' },
}

// 規則分組元資料
export const RULE_GROUP_META = [
  { key: 'exclusion', label: '關聯排除規則' },
  { key: 'fake',      label: '單人作假偵測規則' },
  { key: 'freq',      label: '單裝置回報頻率上限' },
]

const RULE_DEFS = [
  // ── 關聯排除規則（toggle 型）────────────────────────────
  {
    key: 'excl_same_bank', group: 'exclusion', type: 'toggle',
    label: '同收款帳戶排除',
    description: '同一收款帳戶綁定的情報員觸發任務時，廣播過濾排除彼此，防止聯合作假',
    value: 1, unit: '',
  },
  {
    key: 'excl_same_device', group: 'exclusion', type: 'toggle',
    label: '同裝置排除',
    description: '同一裝置識別碼曾登入多帳號時，廣播過濾排除共用裝置帳號',
    value: 1, unit: '',
  },
  {
    key: 'excl_high_cooccur', group: 'exclusion', type: 'toggle',
    label: '高頻共同出沒排除',
    description: '情報員間共同出沒次數超過統計閾值時，廣播過濾視為潛在關聯方',
    value: 0, unit: '',
  },

  // ── 單人作假偵測規則 ─────────────────────────────────────
  {
    key: 'fake_sim_location', group: 'fake', type: 'toggle',
    label: '模擬定位偵測',
    description: '裝置 GPS 軌跡特徵符合模擬器行為時自動標記，進入人工覆核佇列',
    value: 1, unit: '',
  },
  {
    key: 'location_jump_km', group: 'fake',
    label: '位置跳躍閾值',
    description: '相鄰兩筆回報的直線距離超過此值，觸發位置跳躍標記',
    value: 10, unit: '公里',
  },
  {
    key: 'fake_dwell_minutes', group: 'fake',
    label: '停留時間窗閾值',
    description: '回報位置停留時間低於此值視為異常（無正常停留即回報），觸發軌跡合理性警示',
    value: 2, unit: '分鐘',
  },
  {
    key: 'fake_ratio_pct', group: 'fake',
    label: '單人作假佐證比率',
    description: '情報員回報與用戶反饋不符的比率超過此值，進入人工覆核佇列',
    value: 40, unit: '%',
  },

  // ── 單裝置回報頻率上限 ───────────────────────────────────
  {
    key: 'high_freq_count', group: 'freq',
    label: '高頻回報閾值（次數）',
    description: '同一裝置在時間窗口內達此回報次數，觸發高頻回報警示',
    value: 5, unit: '次',
  },
  {
    key: 'high_freq_minutes', group: 'freq',
    label: '高頻回報閾值（時間窗口）',
    description: '計算高頻回報次數的時間窗口長度',
    value: 30, unit: '分鐘',
  },
]

export const useAbuseCheckStore = defineStore('abuseCheck', () => {
  const caseList = ref([
    {
      id: 'AC-001',
      type: 'single_fake',
      informantId: 'GI-0042',
      sourceId: null,
      rule: '單人作假佐證比率超過閾值（當月誤報 18/45 筆，達 40%）',
      triggeredAt: '09:12',
      status: 'pending',
      reports: [
        { time: '07:15', type: '施工封路', location: '中山北路三段', result: '系統誤報' },
        { time: '07:52', type: '事故',     location: '敦化南路一段', result: '系統誤報' },
        { time: '08:30', type: '管制',     location: '忠孝東路四段', result: '確認' },
        { time: '09:01', type: '施工封路', location: '復興北路',     result: '系統誤報' },
      ],
      history: [
        { time: '09:12', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' },
      ],
    },
    {
      id: 'AC-002',
      type: 'suspicious_source',
      informantId: null,
      sourceId: 'SRC-C',
      rule: '高頻回報：同裝置 30 分鐘內回報 7 次（閾值 5 次）',
      triggeredAt: '10:44',
      status: 'pending',
      reports: [
        { time: '10:15', type: '臨時路檢', location: '松山路與南京東路口',    result: '待確認' },
        { time: '10:22', type: '臨時路檢', location: '松山路與南京東路口',    result: '待確認' },
        { time: '10:28', type: '事故',     location: '松山路 132 號前',      result: '待確認' },
        { time: '10:35', type: '臨時路檢', location: '八德路四段',           result: '待確認' },
        { time: '10:41', type: '施工封路', location: '八德路四段',           result: '待確認' },
      ],
      history: [
        { time: '10:44', text: '系統觸發覆核，高頻回報次數超過閾值', actor: '系統' },
      ],
    },
    {
      id: 'AC-003',
      type: 'single_fake',
      informantId: 'GI-0071',
      sourceId: null,
      rule: '位置跳躍：相鄰回報距離 23.4 公里（閾值 10 公里）',
      triggeredAt: '昨日 14:20',
      status: 'pending',
      reports: [
        { time: '昨日 13:55', type: '事故', location: '新生北路二段', result: '確認' },
        { time: '昨日 14:18', type: '事故', location: '木柵路一段',   result: '確認' },
      ],
      history: [
        { time: '昨日 14:20', text: '系統觸發覆核，相鄰回報位置跳躍距離異常', actor: '系統' },
      ],
    },
    {
      id: 'AC-004',
      type: 'single_fake',
      informantId: 'GI-0105',
      sourceId: null,
      rule: '單人作假佐證比率超過閾值（當月誤報 11/22 筆，達 50%）',
      triggeredAt: '昨日 09:05',
      status: 'confirmed',
      reports: [
        { time: '昨日 07:00', type: '管制',     location: '基隆路一段',   result: '系統誤報' },
        { time: '昨日 08:10', type: '施工封路', location: '信義路五段',   result: '系統誤報' },
        { time: '昨日 08:55', type: '事故',     location: '羅斯福路三段', result: '系統誤報' },
      ],
      history: [
        { time: '昨日 09:05', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' },
        { time: '昨日 09:32', text: '確認違規，執行停權（確認違規）', actor: '後台人員' },
      ],
    },
    {
      id: 'AC-005',
      type: 'suspicious_source',
      informantId: null,
      sourceId: 'SRC-F',
      rule: '高頻回報：同裝置 30 分鐘內回報 9 次（閾值 5 次）',
      triggeredAt: '2天前 16:00',
      status: 'cleared',
      reports: [
        { time: '2天前 15:30', type: '施工封路', location: '大直街',     result: '確認' },
        { time: '2天前 15:38', type: '施工封路', location: '大直街二段', result: '確認' },
        { time: '2天前 15:45', type: '施工封路', location: '內湖路一段', result: '確認' },
      ],
      history: [
        { time: '2天前 16:00', text: '系統觸發覆核，高頻回報次數超過閾值', actor: '系統' },
        { time: '2天前 16:25', text: '誤判解除，撤銷警示（多方佐證）', actor: '後台人員' },
      ],
    },
    {
      id: 'AC-006',
      type: 'single_fake',
      informantId: 'GI-0118',
      sourceId: null,
      rule: '單人作假佐證比率超過閾值（當月誤報 3/6 筆，達 50%）',
      triggeredAt: '2天前 11:10',
      status: 'cleared',
      reports: [
        { time: '2天前 10:40', type: '臨時路檢', location: '汀州路三段',   result: '系統誤報' },
        { time: '2天前 11:05', type: '臨時路檢', location: '羅斯福路四段', result: '系統誤報' },
      ],
      history: [
        { time: '2天前 11:10', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' },
        { time: '2天前 11:40', text: '誤判解除，撤銷警示（調查核實：新成員回報準確率低屬正常）', actor: '後台人員' },
      ],
    },
  ])

  const ruleList = ref(RULE_DEFS.map(r => ({ ...r, history: [] })))

  const filterStatus = ref('all')
  const selectedId   = ref('AC-001')
  const reportFilter = ref({ ruleType: 'all', informantId: '' })

  const filteredCases = computed(() => {
    const f = filterStatus.value
    if (f === 'all')    return caseList.value
    if (f === 'closed') return caseList.value.filter(c => ['confirmed', 'cleared'].includes(c.status))
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
    let list = caseList.value
    const { ruleType, informantId } = reportFilter.value
    if (ruleType !== 'all') list = list.filter(c => c.type === ruleType)
    if (informantId.trim()) {
      const q = informantId.trim().toLowerCase()
      list = list.filter(c =>
        (c.informantId ?? '').toLowerCase().includes(q) ||
        (c.sourceId ?? '').toLowerCase().includes(q)
      )
    }
    return list
  })

  function setFilter(key) { filterStatus.value = key }
  function select(id)     { selectedId.value = id }

  function applyCaseAction(id, action, reason) {
    const c = caseList.value.find(c => c.id === id)
    if (!c) return
    const tr = TRANSITIONS[action]
    if (!tr || !tr.from.includes(c.status)) return
    c.status = tr.to
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    c.history.push({ time: now, text: `${tr.text}（${reason}）`, actor: '後台人員' })
  }

  function updateRule(key, value, reason) {
    const rule = ruleList.value.find(r => r.key === key)
    if (!rule) return
    const oldValue = rule.value
    rule.value = Number(value)
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    rule.history.push({ time: now, from: oldValue, to: Number(value), reason, actor: '後台人員' })
  }

  return {
    caseList, ruleList, filterStatus, selectedId, reportFilter,
    filteredCases, selectedCase, pendingCount, ruleMap, filteredReports,
    setFilter, select, applyCaseAction, updateRule, rulesInGroup,
  }
})
