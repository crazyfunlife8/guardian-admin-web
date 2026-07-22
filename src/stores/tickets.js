import { ref, computed } from 'vue'
import { defineStore }   from 'pinia'

export const TICKET_TYPES = ['積分爭議', '帳號問題', '任務糾紛', '系統反饋', '其他']

export const STATUS_LABELS = {
  pending:    '待處理',
  processing: '處理中',
  closed:     '已結案',
  rejected:   '已退單',
}
export const STATUS_VARIANTS = {
  pending:    'wait',
  processing: 'info',
  closed:     'ok',
  rejected:   'danger',
}

export const FILTERS = [
  { label: '待處理', key: 'pending' },
  { label: '處理中', key: 'processing' },
  { label: '已結案', key: 'closed' },
  { label: '已退單', key: 'rejected' },
  { label: '全部',   key: 'all' },
]

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref([
    {
      id: 'TK-001',
      type: '積分爭議',
      status: 'pending',
      description: '本月任務完成率達標但積分未正常入帳，已等待超過 48 小時，系統顯示「處理中」但無進一步說明。',
      relatedEventId: null,
      relatedInformantId: 'GI-0042',
      submittedAt: '2026-07-22 08:30',
      history: [
        { time: '2026-07-22 08:30', text: '工單建立', actor: 'ADM-002' },
      ],
    },
    {
      id: 'TK-002',
      type: '帳號問題',
      status: 'processing',
      description: '帳號無法登入，重設密碼後仍顯示「帳號已停用」，但運營人員未收到任何停用通知。',
      relatedEventId: null,
      relatedInformantId: 'GI-0031',
      submittedAt: '2026-07-21 14:15',
      history: [
        { time: '2026-07-21 14:15', text: '工單建立', actor: 'ADM-001' },
        { time: '2026-07-21 15:03', text: '受理，開始調查帳號停用記錄', actor: 'ADM-003' },
      ],
    },
    {
      id: 'TK-003',
      type: '任務糾紛',
      status: 'processing',
      description: '情報員反映驗證任務廣播後無人接單，逾時後系統自動記為「逾時失敗」並扣除信譽分，認為應屬系統異常非個人失誤。',
      relatedEventId: 'EV-003',
      relatedInformantId: 'GI-0015',
      submittedAt: '2026-07-21 09:45',
      history: [
        { time: '2026-07-21 09:45', text: '工單建立', actor: 'ADM-002' },
        { time: '2026-07-21 10:22', text: '受理，查詢事件 EV-003 廣播紀錄', actor: 'ADM-002' },
        { time: '2026-07-21 11:15', text: '回覆：廣播紀錄顯示當時區域情報員均離線，確認為覆蓋率不足，非系統故障', actor: 'ADM-002' },
      ],
    },
    {
      id: 'TK-004',
      type: '系統反饋',
      status: 'closed',
      description: '建議 App 地圖事件圖標改為更易辨識的形狀，目前圓形圖標在深色底圖上不夠清晰。',
      relatedEventId: null,
      relatedInformantId: null,
      submittedAt: '2026-07-20 16:00',
      history: [
        { time: '2026-07-20 16:00', text: '工單建立', actor: 'ADM-001' },
        { time: '2026-07-20 16:30', text: '受理，轉記產品反饋清單', actor: 'ADM-001' },
        { time: '2026-07-20 17:00', text: '結案：已轉交產品團隊，列入下版本迭代評估', actor: 'ADM-001' },
      ],
    },
    {
      id: 'TK-005',
      type: '積分爭議',
      status: 'rejected',
      description: '稱積分遭系統誤扣，但核對兌換核銷記錄 RD-0001 顯示扣除合規，資料有誤。',
      relatedEventId: null,
      relatedInformantId: 'GI-0028',
      submittedAt: '2026-07-19 11:20',
      history: [
        { time: '2026-07-19 11:20', text: '工單建立', actor: 'ADM-003' },
        { time: '2026-07-19 13:45', text: '退單：核對 RD-0001，扣除操作符合規則，無誤扣情形', actor: 'ADM-003' },
      ],
    },
  ])

  const selectedId   = ref('TK-001')
  const filterStatus = ref('all')
  let _seq = 6

  const filteredTickets = computed(() => {
    if (filterStatus.value === 'all') return tickets.value
    return tickets.value.filter(t => t.status === filterStatus.value)
  })

  const selectedTicket = computed(() =>
    tickets.value.find(t => t.id === selectedId.value) ?? null
  )

  function select(id)     { selectedId.value   = id }
  function setFilter(key) { filterStatus.value = key }

  function addTicket(data) {
    const id  = `TK-00${_seq++}`
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16)
    tickets.value.unshift({
      id,
      type:               data.type,
      status:             'pending',
      description:        data.description,
      relatedEventId:     data.relatedEventId     || null,
      relatedInformantId: data.relatedInformantId || null,
      submittedAt:        now,
      history: [{ time: now, text: '工單建立', actor: 'ADM-001' }],
    })
    selectedId.value = id
  }

  function applyAction(id, action, reason) {
    const ticket = tickets.value.find(t => t.id === id)
    if (!ticket) return
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16)
    switch (action) {
      case 'accept':
        ticket.status = 'processing'
        ticket.history.push({ time: now, text: '受理，開始調查', actor: 'ADM-001' })
        break
      case 'reject':
        ticket.status = 'rejected'
        ticket.history.push({ time: now, text: `退單：${reason}`, actor: 'ADM-001' })
        break
      case 'reply':
        ticket.history.push({ time: now, text: `回覆：${reason}`, actor: 'ADM-001' })
        break
      case 'close':
        ticket.status = 'closed'
        ticket.history.push({ time: now, text: `結案：${reason}`, actor: 'ADM-001' })
        break
    }
  }

  return {
    tickets, selectedId, filterStatus,
    filteredTickets, selectedTicket,
    select, setFilter, addTicket, applyAction,
  }
})
