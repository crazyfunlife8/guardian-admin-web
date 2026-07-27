import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// navTo 規則：
//   ev / task + link:'地圖' → 地圖 fly-to（未串接前暫跳事件詳情頁；task 無獨立頁留 null）
//   alert + link:'詳情'     → 管線斷源告警屬 OP-1 範疇，留在當頁（null）
//   human + link:'詳情'     → 依操作所屬頁面跳轉
//   abuse + link:'詳情'     → 反濫用儀表 /op7
const MOCK_LOGS = [
  { id: 1, time: '22:47:28', tag: 'alert',  text: '情報網任務源 (g) 斷線判定成立——連續 3 次拉取失敗',         link: '詳情', navTo: null,           isNew: true },
  { id: 2, time: '22:47:12', tag: 'task',   text: 'T-88213 逾時無人接・半徑放大至第 2 檔重新廣播',          link: '地圖', navTo: null           },
  { id: 3, time: '22:46:55', tag: 'ev',     text: 'E-30771 臨時路檢（環河南路二段北向）新回報・未確認上圖', link: '地圖', navTo: null           },
  { id: 4, time: '22:46:31', tag: 'human',  text: 'OP-07 下架 E-30764（依據：多方反饋）・已留跡',          link: '詳情', navTo: '/op7'          },
  { id: 5, time: '22:45:58', tag: 'task',   text: 'T-88209 已接單（情報員 GI-0042・鎖定 15 分）',          link: '地圖', navTo: null           },
  { id: 6, time: '22:45:20', tag: 'abuse',  text: '裝置 D-7f31 回報頻率超限・自動標記＋警示合併',           link: '詳情', navTo: '/op7'          },
  { id: 7, time: '22:44:47', tag: 'ev',     text: 'E-30768 事故（市民高架）感測佐證印證・升已驗證',         link: '地圖', navTo: null           },
]

export const useLogsStore = defineStore('logs', () => {
  const logs = ref([...MOCK_LOGS])
  const activeTag = ref('all')

  const visibleLogs = computed(() =>
    activeTag.value === 'all'
      ? logs.value
      : logs.value.filter(l => l.tag === activeTag.value)
  )

  function setTag(tag) { activeTag.value = tag }

  function pushLog(entry) {
    logs.value.unshift({ ...entry, id: Date.now(), isNew: true })
    setTimeout(() => {
      const l = logs.value.find(x => x.id === entry.id)
      if (l) l.isNew = false
    }, 500)
  }

  return { logs, activeTag, visibleLogs, setTag, pushLog }
})
