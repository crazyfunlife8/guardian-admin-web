import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MOCK_ORDERS = [
  {
    id: 'R-2026-0713-018', source: '表單', state: 'wait',
    informantId: 'GI-0042', rewardType: '現金', amount: 'NT$8,000', time: '22:31',
    applySource: '表單（兌換中心）', rewardDetail: '現金 NT$8,000',
    limitCheck: true, denialStatus: '未否認',
    balance: 12450, frozen: 5000, deferred: 0, accountStatus: 'ok',
    maskedAccount: '●●●-●●●●●●-●42',
    realAccount: '012-123456-042',
    history: [
      { time: '22:31:07', text: '申請建單（表單自動）', actor: '系統', done: true },
      { time: '22:31:07', text: '進入待核對佇列・待辦徽章 +1', actor: '系統', done: true },
      { time: '——', text: '等待核對：顯示餘額與綁定帳戶、核對成立當下即時凍結', actor: null },
    ],
  },
  {
    id: 'R-2026-0713-017', source: 'LINE 代收', state: 'wait',
    informantId: 'GI-0018', rewardType: '加油券', amount: 'NT$3,000', time: '21:56',
    applySource: 'LINE 代收', rewardDetail: '加油券 NT$3,000',
    limitCheck: true, denialStatus: '未否認',
    balance: 7200, frozen: 0, deferred: 0, accountStatus: 'ok',
    maskedAccount: '●●●-●●●●●●-●18',
    realAccount: '012-654321-018',
    history: [
      { time: '21:56:22', text: 'LINE 代收建單（OP-05 手動）', actor: 'OP-05', done: true },
      { time: '21:56:22', text: '進入待核對佇列', actor: '系統', done: true },
    ],
  },
  {
    id: 'R-2026-0713-016', source: '表單', state: 'checked',
    informantId: 'GI-0067', rewardType: '現金', amount: 'NT$12,000', time: '20:12',
    applySource: '表單（兌換中心）', rewardDetail: '現金 NT$12,000',
    limitCheck: true, denialStatus: '未否認',
    balance: 18900, frozen: 12000, deferred: 0, accountStatus: 'ok',
    maskedAccount: '●●●-●●●●●●-●67',
    realAccount: '012-789012-067',
    history: [
      { time: '20:12:05', text: '申請建單（表單自動）', actor: '系統', done: true },
      { time: '20:15:30', text: '核對成立・凍結 12,000', actor: 'OP-07', done: true },
    ],
  },
  {
    id: 'R-2026-0713-015', source: '表單', state: 'hold',
    informantId: 'GI-0029', rewardType: '禮券', amount: 'NT$1,500', time: '19:40',
    applySource: '表單（兌換中心）', rewardDetail: '禮券 NT$1,500',
    limitCheck: true, denialStatus: '未否認',
    balance: 3800, frozen: 1500, deferred: 0, accountStatus: 'suspended',
    maskedAccount: '●●●-●●●●●●-●29',
    realAccount: '012-345678-029',
    history: [
      { time: '19:40:11', text: '申請建單（表單自動）', actor: '系統', done: true },
      { time: '20:02:00', text: '帳號停權・核銷單自動掛起', actor: '系統', done: true },
    ],
  },
  {
    id: 'R-2026-0713-014', source: '表單', state: 'issued',
    informantId: 'GI-0042', rewardType: '現金', amount: 'NT$5,000', time: '18:03',
    applySource: '表單（兌換中心）', rewardDetail: '現金 NT$5,000',
    limitCheck: true, denialStatus: '未否認',
    balance: 12450, frozen: 5000, deferred: 0, accountStatus: 'ok',
    maskedAccount: '●●●-●●●●●●-●42',
    realAccount: '012-123456-042',
    history: [
      { time: '18:03:22', text: '申請建單（表單自動）', actor: '系統', done: true },
      { time: '18:10:05', text: '核對成立・凍結 5,000', actor: 'OP-03', done: true },
      { time: '18:25:40', text: '回填發放憑證・轉已發放', actor: 'OP-03', done: true },
    ],
  },
]

export const useRedemptionStore = defineStore('redemption', () => {
  const orders      = ref([...MOCK_ORDERS])
  const selectedId  = ref('R-2026-0713-018')
  const filterState = ref('wait')

  const selectedOrder = computed(() =>
    orders.value.find(o => o.id === selectedId.value) ?? null
  )

  const filteredOrders = computed(() =>
    filterState.value === 'all'
      ? orders.value
      : orders.value.filter(o => o.state === filterState.value)
  )

  function select(id) { selectedId.value = id }
  function setFilter(state) { filterState.value = state }

  function applyAction(orderId, action, reason) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    const now = new Date()
    const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':')

    const transitions = {
      confirm:  { from: 'wait',    to: 'checked', text: `核對成立（依據：${reason}）` },
      reject:   { from: 'wait',    to: 'reject',  text: `拒單（依據：${reason}）` },
      fillVoucher: { from: 'checked', to: 'issued', text: `回填發放憑證・轉已發放（依據：${reason}）` },
      failBack: { from: 'checked', to: 'wait',    text: `發放失敗・解凍退回待核對（依據：${reason}）` },
      deduct:   { from: 'issued',  to: 'done',    text: `扣除確認（依據：${reason}）` },
    }

    const t = transitions[action]
    if (!t || order.state !== t.from) return

    order.state = t.to
    order.history.push({ time: timeStr, text: t.text, actor: 'OP-07', done: true })
  }

  return { orders, selectedId, selectedOrder, filteredOrders, filterState,
           select, setFilter, applyAction }
})
