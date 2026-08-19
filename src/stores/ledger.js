import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

export const TX_TYPE_LABELS = {
  Credit:       '積分入帳',
  Debit:        '積分扣除',
  Freeze:       '凍結',
  Unfreeze:     '解凍退回',
  Defer:        '遞延',
  DeferRelease: '遞延解除',
}

export const SOURCE_REF_LABELS = {
  Task:       '任務',
  Adjustment: '人工調整',
  Redemption: '兌換申請',
}

function mapEntry(d, informantId) {
  const refLabel = SOURCE_REF_LABELS[d.sourceRefType] ?? d.sourceRefType ?? ''
  const refId    = d.sourceRefId ?? null
  return {
    id:           String(d.id),
    informantId:  informantId ?? null,
    entryType:    d.entryType ?? '',
    amount:       d.amount ?? 0,
    sourceRefType: d.sourceRefType ?? null,
    sourceRefId:  refId,
    note:         refLabel + (refId ? ` #${refId}` : ''),
    date:         d.createdAt ? d.createdAt.slice(0, 10) : '',
    time:         d.createdAt ? new Date(d.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '',
    balance:      d.balance ?? null,
  }
}

export const useLedgerStore = defineStore('ledger', () => {
  const txList      = ref([])
  const invariant   = ref(null)
  const currentId   = ref('')    // 目前載入的情報員 id

  const filterState = ref({
    informantId: '',
    dateFrom:    '',
    dateTo:      '',
    type:        'all',
  })

  const filteredTx = computed(() => {
    const { dateFrom, dateTo, type } = filterState.value
    return txList.value.filter(tx => {
      if (dateFrom && tx.date < dateFrom) return false
      if (dateTo   && tx.date > dateTo)   return false
      if (type !== 'all' && tx.entryType !== type) return false
      return true
    })
  })

  async function fetch(informantId) {
    try {
      currentId.value = String(informantId)
      const { data } = await client.get(`/api/backend/informants/${informantId}/ledger`)
      txList.value = data.map(d => mapEntry(d, informantId))
    } catch (err) {
      console.error('ledger fetch failed', err)
    }
  }

  async function fetchInvariant(informantId) {
    try {
      const { data } = await client.get(`/api/backend/informants/${informantId}/invariant`)
      invariant.value = data
    } catch (err) {
      console.error('invariant fetch failed', err)
    }
  }

  function setFilter(key, value) {
    filterState.value[key] = value
  }

  function presetInformant(id) {
    filterState.value.informantId = id
    fetch(id)
  }

  async function credit(informantId, amount, reason) {
    await client.post(`/api/backend/informants/${informantId}/credit`, { amount, reason })
    // 重新載入以取得最新帳本
    await fetch(informantId)
  }

  return { txList, invariant, filterState, filteredTx, currentId,
           fetch, fetchInvariant, setFilter, presetInformant, credit }
})
