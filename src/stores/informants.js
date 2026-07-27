import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useInformantsStore = defineStore('informants', () => {
  const informants = ref([
    {
      id: 'GI-0042',
      name: '王大明',
      phoneSuffix: '5566',
      idSuffix:    '789',
      bankAccount: '5566',
      plateSuffix: 'AA1',
      zone: '北投／士林',
      joinedAt: '2025-01-10',
      status: 'active',
      reputation: { score: 94, accuracy30d: 91, falseReports: 1 },
      taskSummary: { monthlyCount: 38, completionRate: 97, abandonCount: 1, auditResult: '通過' },
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
      idSuffix:    '431',
      bankAccount: '3312',
      plateSuffix: 'BK5',
      zone: '內湖／南港',
      joinedAt: '2025-02-20',
      status: 'active',
      reputation: { score: 88, accuracy30d: 85, falseReports: 3 },
      taskSummary: { monthlyCount: 21, completionRate: 91, abandonCount: 2, auditResult: '通過' },
      balance: { redeemable: 870, frozen: 0, monthlyEarned: 310 },
      reviewHistory: [
        { time: '2025-02-18', text: '申請提交', actor: '系統' },
        { time: '2025-02-19', text: '進入審核中', actor: '系統' },
        { time: '2025-02-20', text: '審核通過（多方反饋）', actor: '後台 admin' },
      ],
      appealHistory: [],
      tags: { system: [], manual: [] },
    },
    {
      id: 'GI-0105',
      name: '陳建宏',
      phoneSuffix: '9901',
      idSuffix:    '612',
      bankAccount: '9901',
      plateSuffix: 'CC3',
      zone: '萬華／中正',
      joinedAt: '2025-03-05',
      status: 'suspended',
      reputation: { score: 41, accuracy30d: 38, falseReports: 17 },
      taskSummary: { monthlyCount: 0, completionRate: 0, abandonCount: 5, auditResult: '待抽查' },
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
      idSuffix:    '208',
      bankAccount: '7743',
      plateSuffix: 'EF8',
      zone: '信義／大安',
      joinedAt: '2026-07-01',
      status: 'reviewing',
      reputation: { score: null, accuracy30d: null, falseReports: 0 },
      taskSummary: { monthlyCount: 2, completionRate: 100, abandonCount: 0, auditResult: '無紀錄' },
      balance: { redeemable: 80, frozen: 0, monthlyEarned: 80 },
      reviewHistory: [
        { time: '2026-06-29', text: '申請提交', actor: '系統' },
        { time: '2026-06-30', text: '進入審核中', actor: '系統' },
      ],
      appealHistory: [],
      tags: { system: [], manual: [] },
    },
    {
      id: 'GI-0033',
      name: '吳明達',
      phoneSuffix: '4421',
      idSuffix:    '554',
      bankAccount: '4421',
      plateSuffix: 'GH9',
      zone: '松山／中山',
      joinedAt: '2024-11-15',
      status: 'removed',
      reputation: { score: 18, accuracy30d: null, falseReports: 31 },
      taskSummary: { monthlyCount: 0, completionRate: 0, abandonCount: 12, auditResult: '不通過' },
      balance: { redeemable: 320, frozen: 0, monthlyEarned: 0 },
      reviewHistory: [
        { time: '2024-11-13', text: '申請提交', actor: '系統' },
        { time: '2024-11-14', text: '進入審核中', actor: '系統' },
        { time: '2024-11-15', text: '審核通過（內部查核）', actor: '後台 admin' },
        { time: '2025-08-02', text: '帳號除名（反覆違規）', actor: '後台 admin' },
      ],
      appealHistory: [
        { date: '2025-08-05', reason: '除名申訴', result: '不成立' },
      ],
      tags: { system: ['高頻回報', '區域異常', '配對異常'], manual: [] },
    },
  ])

  function getById(id) {
    return informants.value.find(i => i.id === id) ?? null
  }

  function _now() {
    return new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16)
  }

  function suspend(id, reason) {
    const inf = informants.value.find(i => i.id === id)
    if (!inf || ['suspended', 'removed', 'cleared'].includes(inf.status)) return
    inf.status = 'suspended'
    inf.reviewHistory.push({ time: _now(), text: `帳號停權（${reason}）`, actor: 'ADM-001' })
  }

  function reinstate(id, reason) {
    const inf = informants.value.find(i => i.id === id)
    if (!inf || inf.status !== 'suspended') return
    inf.status = 'active'
    inf.reviewHistory.push({ time: _now(), text: `帳號恢復（${reason}）`, actor: 'ADM-001' })
  }

  function remove(id, reason) {
    const inf = informants.value.find(i => i.id === id)
    if (!inf || ['removed', 'cleared'].includes(inf.status)) return
    inf.status = 'removed'
    inf.reviewHistory.push({ time: _now(), text: `帳號除名（${reason}）`, actor: 'ADM-001' })
  }

  function adjustReputation(id, delta, reason) {
    const inf = informants.value.find(i => i.id === id)
    if (!inf) return
    const prev = inf.reputation.score ?? 50
    const next = Math.max(0, Math.min(100, prev + delta))
    inf.reputation.score = next
    inf.reviewHistory.push({
      time:  _now(),
      text:  `信譽分調整 ${delta > 0 ? '+' : ''}${delta}（${reason}）[${prev} → ${next}]`,
      actor: 'ADM-001',
    })
  }

  return { informants, getById, suspend, reinstate, remove, adjustReputation }
})
