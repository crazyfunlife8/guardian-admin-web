import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

// 前端 UI 元資料：分組/標籤/說明/單位/type，key 對應後端 ParameterItem.key
// 後端只儲存 key + value（string）；顯示用的 label/description 由前端持有
const PARAM_DEFS = [
  // ── 事件生命週期 ──────────────────────────────────────────────────────────
  { key: 'inspection_ttl', group: 'lifecycle', label: '臨時路檢預設 TTL', description: '臨時路檢事件建立後預設存活時間，到期仍無確認則進入寬限窗', defaultValue: 30, unit: '分' },
  { key: 'accident_ttl',   group: 'lifecycle', label: '事故預設 TTL',     description: '事故事件建立後預設存活時間', defaultValue: 60, unit: '分' },
  { key: 'construction_ttl', group: 'lifecycle', label: '施工預設 TTL',   description: '施工事件建立後預設存活時間', defaultValue: 120, unit: '分' },
  { key: 'control_ttl',    group: 'lifecycle', label: '管制預設 TTL',     description: '管制事件建立後預設存活時間', defaultValue: 90, unit: '分' },
  { key: 'termination_grace', group: 'lifecycle', label: '事件終止寬限窗', description: 'TTL 歸零後等待此時間，若仍無人工確認則系統自動下架', defaultValue: 0, unit: '分' },
  { key: 'alert_threshold', group: 'lifecycle', label: '警示狀態門檻', description: '單一區域內未確認事件累積達此數量時觸發警示播報', defaultValue: 3, unit: '件' },

  // ── 驗證任務 ───────────────────────────────────────────────────────────────
  { key: 'broadcast_radius_1', group: 'task', label: '廣播半徑第 1 檔', description: '驗證任務優先廣播給此半徑內的上線情報員', defaultValue: 500, unit: '公尺' },
  { key: 'broadcast_radius_2', group: 'task', label: '廣播半徑第 2 檔', description: '第 1 檔逾時無人接單後，擴大至此半徑重新廣播', defaultValue: 1000, unit: '公尺' },
  { key: 'broadcast_radius_3', group: 'task', label: '廣播半徑第 3 檔', description: '廣播的最大半徑上限，達此範圍後不再擴大', defaultValue: 2000, unit: '公尺' },
  { key: 'escalation_wait',    group: 'task', label: '逾時升檔等待時間', description: '每次升檔前等待的時間，超時未接單自動升至下一檔廣播範圍', defaultValue: 10, unit: '分' },
  { key: 'lock_duration',      group: 'task', label: '鎖單時長', description: '情報員接單後的鎖定期', defaultValue: 15, unit: '分' },
  { key: 'audit_ratio',        group: 'task', label: '抽查比例', description: '完成任務中隨機抽取進行品質抽查的比例', defaultValue: 5, unit: '%' },
  { key: 'cancel_compensation', group: 'task', label: '任務取消補償', description: '情報員接單後因系統原因取消所給予的補償積分', defaultValue: 0, unit: '積分' },
  { key: 'dispatch_ttl_threshold', group: 'task', label: '派單前 TTL 門檻', description: '事件剩餘 TTL 低於此值時，不再廣播新任務', defaultValue: 10, unit: '分' },

  // ── 任務積分費率 ────────────────────────────────────────────────────────────
  { key: 'rate_inspection', group: 'rates', label: '臨時路檢任務費率', description: '情報員完成臨時路檢驗證任務所獲得的積分', defaultValue: 50, unit: '積分' },
  { key: 'rate_accident',   group: 'rates', label: '事故任務費率',     description: '情報員完成事故驗證任務所獲得的積分', defaultValue: 80, unit: '積分' },
  { key: 'rate_construction', group: 'rates', label: '施工任務費率',   description: '情報員完成施工驗證任務所獲得的積分', defaultValue: 60, unit: '積分' },
  { key: 'rate_control',    group: 'rates', label: '管制任務費率',     description: '情報員完成管制驗證任務所獲得的積分', defaultValue: 70, unit: '積分' },

  // ── 開關設定 ──────────────────────────────────────────────────────────────
  { key: 'personal_cap_enabled',       group: 'switches', type: 'toggle', label: '單人日／週積分上限',     description: '開啟後對每位情報員設定每日及每週積分上限', defaultValue: 0, unit: '' },
  { key: 'passive_hint_enabled',       group: 'switches', type: 'toggle', label: '被動感測「疑似提示」開關', description: '開啟後被動感測命中時對用戶顯示「疑似提示」', defaultValue: 0, unit: '' },
  { key: 'escalation_bonus_enabled',   group: 'switches', type: 'toggle', label: '逾時加價階梯',           description: '開啟後任務逾時未接單時自動提高費率', defaultValue: 0, unit: '' },
]

export const GROUP_META = [
  { key: 'lifecycle', label: '事件生命週期' },
  { key: 'task',      label: '驗證任務' },
  { key: 'rates',     label: '任務積分費率' },
  { key: 'switches',  label: '開關設定' },
]

// AreaTaskMode enum（PascalCase）
export const REGION_MODE_LABELS = {
  Normal:       '正常',
  DisplayOnly:  '只顯示不派單',
  PauseNew:     '暫停新任務',
  InternalOnly: '只允許內部派遣',
}

export const useParamsStore = defineStore('params', () => {
  // 以 PARAM_DEFS 為基礎，value 由 API 覆寫；history 前端記錄
  const paramList = ref(PARAM_DEFS.map(p => ({ ...p, value: p.defaultValue, history: [] })))

  const paramMap = computed(() =>
    Object.fromEntries(paramList.value.map(p => [p.key, p]))
  )

  function paramsInGroup(groupKey) {
    return paramList.value.filter(p => p.group === groupKey)
  }

  async function loadParams() {
    try {
      const { data } = await client.get('/api/backend/parameters')
      // 合併後端值到本地 PARAM_DEFS
      data.forEach(item => {
        const p = paramList.value.find(x => x.key === item.key)
        if (p) p.value = Number(item.value) ?? p.defaultValue
      })
    } catch (err) {
      console.error('loadParams failed', err)
    }
  }

  async function updateParam(key, value, reason) {
    const param = paramList.value.find(p => p.key === key)
    if (!param) return
    const oldValue = param.value
    // TODO(後端): PUT /api/backend/parameters/{key} 的 request body 在 OpenAPI 中為 {}（未定義格式）
    // 暫時送 { value: String(value) }，需後端確認正確格式
    await client.put(`/api/backend/parameters/${key}`, { value: String(value) })
    param.value = Number(value)
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    param.history.push({ time: now, from: oldValue, to: Number(value), reason, actor: '後台人員' })
  }

  // ── 分區任務開關（Region Modes）──────────────────────────────────────────
  const regionModes = ref([])

  async function loadRegionModes() {
    try {
      const { data } = await client.get('/api/backend/region-modes')
      regionModes.value = data  // RegionModeItem[]: { adminAreaCode, eventType, mode, updatedAt }
    } catch (err) {
      console.error('loadRegionModes failed', err)
    }
  }

  async function updateRegionMode(adminAreaCode, eventType, mode) {
    await client.put('/api/backend/region-modes', { adminAreaCode, eventType, mode })
    const r = regionModes.value.find(r => r.adminAreaCode === adminAreaCode && r.eventType === eventType)
    if (r) r.mode = mode
  }

  return {
    paramList, paramMap, paramsInGroup,
    loadParams, updateParam,
    regionModes, loadRegionModes, updateRegionMode,
  }
})
