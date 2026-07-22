import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TRANSITIONS = {
  approve: { from: ['pending'], to: 'approved', text: '審核通過' },
  reject:  { from: ['pending'], to: 'rejected', text: '審核拒絕' },
}

export const useReviewStore = defineStore('review', () => {
  const applications = ref([
    {
      id: 'AP-0001', name: '陳志豪',
      phoneSuffix: '8847', plateSuffix: 'BD9', zone: '北投／士林',
      status: 'pending', submittedAt: '07:20',
      history: [
        { time: '07:20', text: '申請提交', actor: '系統' },
        { time: '07:21', text: '進入審核中', actor: '系統' },
      ],
    },
    {
      id: 'AP-0002', name: '林美玲',
      phoneSuffix: '3312', plateSuffix: 'AK5', zone: '內湖／南港',
      status: 'pending', submittedAt: '08:45',
      history: [
        { time: '08:45', text: '申請提交', actor: '系統' },
        { time: '08:46', text: '進入審核中', actor: '系統' },
      ],
    },
    {
      id: 'AP-0003', name: '王建民',
      phoneSuffix: '6601', plateSuffix: 'CC2', zone: '信義／大安',
      status: 'approved', submittedAt: '昨日 16:10',
      history: [
        { time: '昨日 16:10', text: '申請提交', actor: '系統' },
        { time: '昨日 16:11', text: '進入審核中', actor: '系統' },
        { time: '昨日 17:02', text: '審核通過（內部查核）', actor: '後台 admin' },
      ],
    },
    {
      id: 'AP-0004', name: '黃怡君',
      phoneSuffix: '2298', plateSuffix: 'EF8', zone: '萬華／中正',
      status: 'approved', submittedAt: '昨日 09:30',
      history: [
        { time: '昨日 09:30', text: '申請提交', actor: '系統' },
        { time: '昨日 09:31', text: '進入審核中', actor: '系統' },
        { time: '昨日 10:15', text: '審核通過（多方反饋）', actor: '後台 admin' },
      ],
    },
    {
      id: 'AP-0005', name: '李俊宏',
      phoneSuffix: '7743', plateSuffix: 'GH1', zone: '松山／中山',
      status: 'rejected', submittedAt: '昨日 14:00',
      history: [
        { time: '昨日 14:00', text: '申請提交', actor: '系統' },
        { time: '昨日 14:01', text: '進入審核中', actor: '系統' },
        { time: '昨日 15:30', text: '審核拒絕（照片不清晰）', actor: '後台 admin' },
      ],
    },
    {
      id: 'AP-0006', name: '張雅婷',
      phoneSuffix: '5591', plateSuffix: 'JK4', zone: '文山／景美',
      status: 'rejected', submittedAt: '2天前 11:20',
      history: [
        { time: '2天前 11:20', text: '申請提交', actor: '系統' },
        { time: '2天前 11:21', text: '進入審核中', actor: '系統' },
        { time: '2天前 13:00', text: '審核拒絕（服務區域未開放）', actor: '後台 admin' },
      ],
    },
  ])

  const filterStatus = ref('all')
  const selectedId   = ref('AP-0001')

  const filteredApps = computed(() => {
    if (filterStatus.value === 'all') return applications.value
    return applications.value.filter(a => a.status === filterStatus.value)
  })

  const selectedApp = computed(() =>
    applications.value.find(a => a.id === selectedId.value) ?? null
  )

  function setFilter(key) { filterStatus.value = key }
  function select(id)     { selectedId.value = id }

  function applyReviewAction(id, action, reason) {
    const app = applications.value.find(a => a.id === id)
    if (!app) return
    const tr = TRANSITIONS[action]
    if (!tr || !tr.from.includes(app.status)) return
    if (tr.to) app.status = tr.to
    const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    app.history.push({ time: now, text: `${tr.text}（${reason}）`, actor: '後台人員' })
  }

  return { applications, filterStatus, selectedId, filteredApps, selectedApp, setFilter, select, applyReviewAction }
})
