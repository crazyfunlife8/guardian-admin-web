import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const TX_TYPE_LABELS = {
  credit:   '積分入帳',
  freeze:   '凍結',
  deduct:   '兌換扣除',
  unfreeze: '解凍退回',
  adjust:   '系統調整',
}

const MOCK_TX = [
  // GI-0042（redeemable 2150, frozen 500, monthlyEarned 680）
  { id: 'TX-0016', informantId: 'GI-0042', type: 'freeze',   amount: -500,  balance: 2150, date: '2026-07-20', time: '13:15', note: '兌換申請 RD-0003 凍結積分，待核對' },
  { id: 'TX-0015', informantId: 'GI-0042', type: 'credit',   amount:  200,  balance: 2650, date: '2026-07-20', time: '11:42', note: '任務 T-1042 完成（施工封路確認）' },
  { id: 'TX-0014', informantId: 'GI-0042', type: 'credit',   amount:  180,  balance: 2450, date: '2026-07-19', time: '16:08', note: '任務 T-1035 完成（事故確認）' },
  { id: 'TX-0013', informantId: 'GI-0042', type: 'credit',   amount:  200,  balance: 2270, date: '2026-07-19', time: '09:31', note: '任務 T-1029 完成（臨時路檢確認）' },
  { id: 'TX-0012', informantId: 'GI-0042', type: 'deduct',   amount: -1000, balance: 2070, date: '2026-07-18', time: '14:22', note: '兌換申請 RD-0001 發放完成，積分扣除' },
  { id: 'TX-0011', informantId: 'GI-0042', type: 'credit',   amount:  100,  balance: 3070, date: '2026-07-17', time: '10:55', note: '任務 T-1018 完成（管制確認）' },

  // GI-0071（redeemable 870, frozen 0, monthlyEarned 310）
  { id: 'TX-0010', informantId: 'GI-0071', type: 'credit',   amount:  180,  balance:  870, date: '2026-07-20', time: '14:50', note: '任務 T-1041 完成（事故確認）' },
  { id: 'TX-0009', informantId: 'GI-0071', type: 'credit',   amount:  130,  balance:  690, date: '2026-07-19', time: '08:17', note: '任務 T-1022 完成（施工封路確認）' },
  { id: 'TX-0008', informantId: 'GI-0071', type: 'unfreeze', amount:  300,  balance:  560, date: '2026-07-17', time: '17:30', note: '兌換申請 RD-0002 發放失敗，凍結積分解除退回' },
  { id: 'TX-0007', informantId: 'GI-0071', type: 'freeze',   amount: -300,  balance:  260, date: '2026-07-16', time: '11:00', note: '兌換申請 RD-0002 凍結積分，待核對' },

  // GI-0105（redeemable 0, frozen 200, monthlyEarned 0）
  { id: 'TX-0006', informantId: 'GI-0105', type: 'freeze',   amount: -200,  balance:    0, date: '2026-07-10', time: '09:05', note: '兌換申請 RD-0004 凍結積分，待核對（帳號已停權，申請掛起）' },
  { id: 'TX-0005', informantId: 'GI-0105', type: 'adjust',   amount: -150,  balance:  200, date: '2026-07-08', time: '15:40', note: '系統調整：誤報罰扣（AC-004 違規確認，操作依據：確認違規）' },
  { id: 'TX-0004', informantId: 'GI-0105', type: 'credit',   amount:  100,  balance:  350, date: '2026-07-05', time: '10:22', note: '任務 T-0891 完成（臨時路檢確認）' },

  // GI-0118（redeemable 80, frozen 0, monthlyEarned 80）
  { id: 'TX-0003', informantId: 'GI-0118', type: 'credit',   amount:   80,  balance:   80, date: '2026-07-18', time: '16:20', note: '任務 T-1031 完成（施工封路確認）' },
  { id: 'TX-0002', informantId: 'GI-0118', type: 'adjust',   amount:   50,  balance:    0, date: '2026-07-15', time: '09:00', note: '系統調整：新成員加入獎勵積分' },
  { id: 'TX-0001', informantId: 'GI-0118', type: 'credit',   amount:    0,  balance:    0, date: '2026-07-14', time: '18:00', note: '帳戶建立' },
]

export const useLedgerStore = defineStore('ledger', () => {
  const txList = ref(MOCK_TX)

  const filterState = ref({
    informantId: '',
    dateFrom:    '',
    dateTo:      '',
    type:        'all',
  })

  const filteredTx = computed(() => {
    const { informantId, dateFrom, dateTo, type } = filterState.value
    return txList.value.filter(tx => {
      if (informantId.trim() && !tx.informantId.toLowerCase().includes(informantId.trim().toLowerCase())) return false
      if (dateFrom && tx.date < dateFrom) return false
      if (dateTo   && tx.date > dateTo)   return false
      if (type !== 'all' && tx.type !== type) return false
      return true
    })
  })

  function setFilter(key, value) {
    filterState.value[key] = value
  }

  function presetInformant(id) {
    filterState.value.informantId = id
  }

  return { txList, filterState, filteredTx, setFilter, presetInformant }
})
