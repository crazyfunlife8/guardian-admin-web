import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useInformantsStore = defineStore('informants', () => {
  const informants = ref([
    {
      id: 'GI-0042',
      name: '王大明',
      phoneSuffix: '5566',
      plateSuffix: 'AA1',
      zone: '北投／士林',
      joinedAt: '2025-01-10',
      status: 'active',
      reputation: { score: 94, accuracy30d: 91, falseReports: 1 },
      taskSummary: { monthlyCount: 38, completionRate: 97, avgResponseSec: 42 },
      balance: { redeemable: 2150, frozen: 500, monthlyEarned: 680 },
      reviewHistory: [
        { time: '2025-01-08', text: '申請提交', actor: '系統' },
        { time: '2025-01-09', text: '進入審核中', actor: '系統' },
        { time: '2025-01-10', text: '審核通過（內部查核）', actor: '後台 admin' },
      ],
      appealHistory: [
        { date: '2025-04-22', reason: '任務評分爭議', result: '成立' },
      ],
      tags: { system: ['高頻回報'], manual: [] },
    },
    {
      id: 'GI-0071',
      name: '林雅惠',
      phoneSuffix: '3312',
      plateSuffix: 'BK5',
      zone: '內湖／南港',
      joinedAt: '2025-02-20',
      status: 'active',
      reputation: { score: 88, accuracy30d: 85, falseReports: 3 },
      taskSummary: { monthlyCount: 21, completionRate: 91, avgResponseSec: 67 },
      balance: { redeemable: 870, frozen: 0, monthlyEarned: 310 },
      reviewHistory: [
        { time: '2025-02-18', text: '申請提交', actor: '系統' },
        { time: '2025-02-19', text: '進入審核中', actor: '系統' },
        { time: '2025-02-20', text: '審核通過（多方反饋）', actor: '後台 admin' },
      ],
      appealHistory: [],
      tags: { system: [], manual: ['重點觀察'] },
    },
    {
      id: 'GI-0105',
      name: '陳建宏',
      phoneSuffix: '9901',
      plateSuffix: 'CC3',
      zone: '萬華／中正',
      joinedAt: '2025-03-05',
      status: 'suspended',
      reputation: { score: 41, accuracy30d: 38, falseReports: 17 },
      taskSummary: { monthlyCount: 0, completionRate: 0, avgResponseSec: 0 },
      balance: { redeemable: 0, frozen: 200, monthlyEarned: 0 },
      reviewHistory: [
        { time: '2025-03-03', text: '申請提交', actor: '系統' },
        { time: '2025-03-04', text: '進入審核中', actor: '系統' },
        { time: '2025-03-05', text: '審核通過（內部查核）', actor: '後台 admin' },
        { time: '2025-06-10', text: '帳號停權（單人作假佐證）', actor: '後台 admin' },
      ],
      appealHistory: [
        { date: '2025-06-12', reason: '停權申訴', result: '不成立' },
      ],
      tags: { system: ['高頻回報', '區域異常'], manual: [] },
    },
    {
      id: 'GI-0118',
      name: '張怡君',
      phoneSuffix: '7743',
      plateSuffix: 'EF8',
      zone: '信義／大安',
      joinedAt: '2026-07-01',
      status: 'reviewing',
      reputation: { score: null, accuracy30d: null, falseReports: 0 },
      taskSummary: { monthlyCount: 2, completionRate: 100, avgResponseSec: 55 },
      balance: { redeemable: 80, frozen: 0, monthlyEarned: 80 },
      reviewHistory: [
        { time: '2026-06-29', text: '申請提交', actor: '系統' },
        { time: '2026-06-30', text: '進入審核中', actor: '系統' },
      ],
      appealHistory: [],
      tags: { system: [], manual: [] },
    },
  ])

  function getById(id) {
    return informants.value.find(i => i.id === id) ?? null
  }

  function addManualTag(id, tag) {
    const inf = informants.value.find(i => i.id === id)
    if (inf && tag && !inf.tags.manual.includes(tag)) {
      inf.tags.manual.push(tag)
    }
  }

  function removeManualTag(id, tag) {
    const inf = informants.value.find(i => i.id === id)
    if (inf) {
      inf.tags.manual = inf.tags.manual.filter(t => t !== tag)
    }
  }

  return { informants, getById, addManualTag, removeManualTag }
})
