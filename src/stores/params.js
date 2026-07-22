import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 參數定義：key / 分組 / 標籤 / 說明 / 預設值 / 單位
const PARAM_DEFS = [
  // ── 事件生命週期 ──────────────────────────────────────
  {
    key: 'inspection_ttl', group: 'lifecycle',
    label: '臨時路檢預設 TTL',
    description: '臨時路檢事件建立後預設存活時間，到期仍無確認則自動下架',
    value: 30, unit: '分',
  },
  {
    key: 'accident_ttl', group: 'lifecycle',
    label: '事故預設 TTL',
    description: '事故事件建立後預設存活時間，到期仍無確認則自動下架',
    value: 60, unit: '分',
  },
  {
    key: 'construction_ttl', group: 'lifecycle',
    label: '施工預設 TTL',
    description: '施工事件建立後預設存活時間，到期仍無確認則自動下架',
    value: 120, unit: '分',
  },
  {
    key: 'control_ttl', group: 'lifecycle',
    label: '管制預設 TTL',
    description: '管制事件建立後預設存活時間，到期仍無確認則自動下架',
    value: 90, unit: '分',
  },
  {
    key: 'max_extend_count', group: 'lifecycle',
    label: '最大延長次數',
    description: '操作員對同一事件手動延長 TTL 的次數上限，達上限後不可再延長',
    value: 3, unit: '次',
  },
  {
    key: 'auto_takedown_wait', group: 'lifecycle',
    label: '自動下架等待時間',
    description: 'TTL 歸零後等待此時間若仍無人工確認，系統自動執行下架',
    value: 5, unit: '分',
  },

  // ── 驗證任務 ──────────────────────────────────────────
  {
    key: 'broadcast_radius_1', group: 'task',
    label: '廣播半徑第 1 檔',
    description: '驗證任務優先廣播給此半徑內的上線情報員',
    value: 500, unit: '公尺',
  },
  {
    key: 'broadcast_radius_2', group: 'task',
    label: '廣播半徑第 2 檔',
    description: '第 1 檔逾時無人接單後，擴大至此半徑重新廣播',
    value: 1000, unit: '公尺',
  },
  {
    key: 'broadcast_radius_3', group: 'task',
    label: '廣播半徑第 3 檔',
    description: '廣播的最大半徑上限，達此範圍後不再擴大',
    value: 2000, unit: '公尺',
  },
  {
    key: 'escalation_wait', group: 'task',
    label: '逾時升檔等待時間',
    description: '每次升檔前等待的時間，超時未接單自動升至下一檔廣播範圍',
    value: 10, unit: '分',
  },
  {
    key: 'lock_duration', group: 'task',
    label: '情報員鎖定時間',
    description: '情報員接單後的鎖定期，期間系統不再向其廣播其他同區域任務',
    value: 15, unit: '分',
  },

  // ── 積分系統 ──────────────────────────────────────────
  {
    key: 'exchange_rate', group: 'points',
    label: '積分兌現比率',
    description: '此數量積分可兌換 1 元現金（例：100 表示 100 積分 ＝ 1 元）',
    value: 100, unit: '積分／元',
  },
  {
    key: 'single_limit', group: 'points',
    label: '單筆兌換上限',
    description: '單次兌換申請金額不得超過此上限，超過須拆單申請',
    value: 20000, unit: '元',
  },
  {
    key: 'monthly_limit', group: 'points',
    label: '月兌換上限',
    description: '每位情報員每自然月可兌換的總金額上限',
    value: 50000, unit: '元',
  },

  // ── 通知 ──────────────────────────────────────────────
  {
    key: 'broadcast_cooldown', group: 'notify',
    label: '任務廣播推播冷卻',
    description: '同一情報員在此冷卻時間內不重複收到相同任務的廣播推播',
    value: 30, unit: '秒',
  },
  {
    key: 'alert_repeat_interval', group: 'notify',
    label: '警示推播重複間隔',
    description: '同一類警示推播在此間隔後才可重複發送，防止通知轟炸',
    value: 5, unit: '分',
  },
]

export const GROUP_META = [
  { key: 'lifecycle', label: '事件生命週期' },
  { key: 'task',      label: '驗證任務' },
  { key: 'points',    label: '積分系統' },
  { key: 'notify',    label: '通知' },
]

export const useParamsStore = defineStore('params', () => {
  // 以 ref 包裝，使每個 param 物件可被 Vue 追蹤
  const paramList = ref(PARAM_DEFS.map(p => ({ ...p, history: [] })))

  // O(1) 查詢：key → param 物件
  const paramMap = computed(() =>
    Object.fromEntries(paramList.value.map(p => [p.key, p]))
  )

  // 依分組取得參數列表
  function paramsInGroup(groupKey) {
    return paramList.value.filter(p => p.group === groupKey)
  }

  /**
   * 修改單一參數值
   * @param {string} key   - 參數 key
   * @param {number} value - 新數值
   * @param {string} reason - 操作依據（來自 ConfirmDialog）
   */
  function updateParam(key, value, reason) {
    const param = paramList.value.find(p => p.key === key)
    if (!param) return
    const oldValue = param.value
    param.value = Number(value)
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    param.history.push({
      time:   now,
      from:   oldValue,
      to:     Number(value),
      reason,
      actor:  '後台人員',
    })
  }

  return { paramList, paramMap, paramsInGroup, updateParam }
})
