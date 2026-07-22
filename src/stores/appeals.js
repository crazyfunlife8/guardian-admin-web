import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TRANSITIONS = {
  accept:  { from: ['pending'],       to: 'investigating', text: '受理申訴，進入調查' },
  uphold:  { from: ['investigating'], to: 'upheld',        text: '裁決成立' },
  reject:  { from: ['investigating'], to: 'rejected',      text: '裁決不成立' },
}

export const useAppealsStore = defineStore('appeals', () => {
  const appeals = ref([
    {
      id: 'AP5-001',
      informantId: 'GI-0042',
      type: '任務評分爭議',
      description: '本次任務回報的路況屬實，但系統評分為誤報，請求重新審核評分結果。回報時間與事件發生時間吻合，現場照片存於任務記錄中。',
      relatedEventId: 'EV-003',
      status: 'pending',
      submittedAt: '08:30',
      result: null,
      history: [
        { time: '08:30', text: '申訴提交', actor: '系統' },
      ],
    },
    {
      id: 'AP5-002',
      informantId: 'GI-0071',
      type: '誤報判定爭議',
      description: '回報當時確有施工封路，惟事後施工結束導致難以驗證，請求重新評估當時的判定依據。',
      relatedEventId: 'EV-001',
      status: 'investigating',
      submittedAt: '昨日 14:20',
      result: null,
      history: [
        { time: '昨日 14:20', text: '申訴提交', actor: '系統' },
        { time: '昨日 14:35', text: '受理申訴，進入調查（內部查核）', actor: '後台人員' },
      ],
    },
    {
      id: 'AP5-003',
      informantId: 'GI-0105',
      type: '停權申訴',
      description: '否認相關違規行為，聲稱系統誤判，請求審查停權決定並提供詳細違規紀錄。',
      relatedEventId: null,
      status: 'rejected',
      submittedAt: '昨日 10:00',
      result: 'rejected',
      history: [
        { time: '昨日 10:00', text: '申訴提交', actor: '系統' },
        { time: '昨日 10:20', text: '受理申訴，進入調查（內部查核）', actor: '後台人員' },
        { time: '昨日 11:30', text: '調查完畢，進入裁決', actor: '後台人員' },
        { time: '昨日 13:00', text: '裁決不成立（規則判定）', actor: '後台 admin' },
      ],
    },
    {
      id: 'AP5-004',
      informantId: 'GI-0042',
      type: '積分計算爭議',
      description: '本月完成任務 38 件，但積分入帳僅反映 31 件，差異 7 件請求確認原因並補發積分。',
      relatedEventId: null,
      status: 'upheld',
      submittedAt: '3天前 09:15',
      result: 'upheld',
      history: [
        { time: '3天前 09:15', text: '申訴提交', actor: '系統' },
        { time: '3天前 09:30', text: '受理申訴，進入調查（內部查核）', actor: '後台人員' },
        { time: '3天前 11:00', text: '調查完畢，進入裁決', actor: '後台人員' },
        { time: '3天前 14:00', text: '裁決成立（調查核實）', actor: '後台 admin' },
      ],
    },
    {
      id: 'AP5-005',
      informantId: 'GI-0118',
      type: '任務評分爭議',
      description: '首次任務遭評為誤報，但回報位置與事件位置完全相符，請求覆核評分依據。',
      relatedEventId: 'EV-002',
      status: 'pending',
      submittedAt: '06:50',
      result: null,
      history: [
        { time: '06:50', text: '申訴提交', actor: '系統' },
      ],
    },
  ])

  const filterStatus = ref('all')
  const selectedId   = ref('AP5-001')

  const filteredAppeals = computed(() => {
    const f = filterStatus.value
    if (f === 'all')    return appeals.value
    if (f === 'closed') return appeals.value.filter(a => ['upheld', 'rejected'].includes(a.status))
    return appeals.value.filter(a => a.status === f)
  })

  const selectedAppeal = computed(() =>
    appeals.value.find(a => a.id === selectedId.value) ?? null
  )

  function setFilter(key) { filterStatus.value = key }
  function select(id)     { selectedId.value = id }

  function applyAction(id, action, reason) {
    const appeal = appeals.value.find(a => a.id === id)
    if (!appeal) return
    const tr = TRANSITIONS[action]
    if (!tr || !tr.from.includes(appeal.status)) return
    appeal.status = tr.to
    if (tr.to === 'upheld')   appeal.result = 'upheld'
    if (tr.to === 'rejected') appeal.result = 'rejected'
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    appeal.history.push({ time: now, text: `${tr.text}（${reason}）`, actor: '後台人員' })
  }

  return { appeals, filterStatus, selectedId, filteredAppeals, selectedAppeal, setFilter, select, applyAction }
})
