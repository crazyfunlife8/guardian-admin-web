import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

function mapProfile(data) {
  const b = data.balance ?? {}
  const ts = data.taskSummary ?? null
  return {
    id:          String(data.id),
    informantNo: data.informantNo ?? '',
    state:       data.state ?? '',
    reputation: {
      score:        data.reputationScore ?? null,
      accuracy30d:  null,
      falseReports: 0,
    },
    qualType:   data.qualType ?? '',
    qualStatus: data.qualStatus ?? '',
    reviewHistory: (data.reputationHistory ?? []).map(h => ({
      time:  h.createdAt ? new Date(h.createdAt).toLocaleDateString('zh-TW') : '',
      text:  `信譽分 ${h.delta >= 0 ? '+' : ''}${h.delta}（${h.reason ?? ''}）`,
      actor: null,
    })),
    nameMasked:  data.nameMasked  ?? '',
    phoneMasked: data.phoneMasked ?? '',
    name:        '',
    phone:       '',
    idNo:        '',
    bankAccount: '',
    joinedAt:    '',
    taskSummary: ts ? {
      monthlyCount:   ts.acceptCount ?? 0,
      completionRate: ts.completionRate ?? null,
      abandonCount:   ts.abandonCount ?? 0,
      auditResult:    ts.auditResult  ?? null,
    } : null,
    balance: { available: b.available ?? 0, frozen: b.frozen ?? 0, deferred: b.deferred ?? 0 },
    appealHistory: (data.appealHistory ?? []),
    tags: { system: [] },
  }
}

export const useInformantsStore = defineStore('informants', () => {
  const informants = ref([])     // summary list for search
  const searching  = ref(false)
  const _cache     = reactive({}) // id → full profile

  function getById(id) {
    return _cache[id] ?? null
  }

  // type: 'no'（情報員編號） | 'phone'（完整手機號 HMAC 比對）
  async function search(q = '', type = 'no') {
    if (!q.trim()) {
      informants.value = []
      return
    }
    try {
      searching.value = true
      const { data } = await client.get('/api/backend/informants', { params: { q, type } })
      informants.value = (data ?? []).map(d => ({
        id:          String(d.id),
        informantNo: d.informantNo ?? '',
        status:      d.state ?? '',
        joinedAt:    d.joinedAt ? new Date(d.joinedAt).toLocaleDateString('zh-TW') : '',
      }))
    } catch {
      informants.value = []
    } finally {
      searching.value = false
    }
  }

  async function fetchProfile(id) {
    try {
      const { data } = await client.get(`/api/backend/informants/${id}/profile`)
      _cache[id] = mapProfile(data)
    } catch (err) {
      console.error('fetchProfile failed', err)
    }
  }

  function _now() {
    return new Date().toLocaleDateString('zh-TW')
  }

  async function suspend(id, reason) {
    await client.post(`/api/backend/informants/${id}/suspend`, { reason })
    if (_cache[id]) {
      _cache[id].state = 'Suspended'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號停權（${reason}）`, actor: '後台人員' })
    }
  }

  async function reinstate(id, reason) {
    await client.post(`/api/backend/informants/${id}/reinstate`, { reason })
    if (_cache[id]) {
      _cache[id].state = 'Active'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號恢復（${reason}）`, actor: '後台人員' })
    }
  }

  async function remove(id, reason) {
    await client.post(`/api/backend/informants/${id}/remove`, { reason })
    if (_cache[id]) {
      _cache[id].state = 'Removed'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號除名（${reason}）`, actor: '後台人員' })
    }
  }

  async function settle(id) {
    await client.post(`/api/backend/informants/${id}/settle`)
    if (_cache[id]) _cache[id].state = 'Cleared'
  }

  async function debit(id, amount, reason) {
    await client.post(`/api/backend/informants/${id}/debit`, { amount, reason })
    if (_cache[id]) {
      _cache[id].balance.available = Math.max(0, _cache[id].balance.available - amount)
      _cache[id].reviewHistory.push({ time: _now(), text: `人工追回 ${amount} 點（${reason}）`, actor: '後台人員' })
    }
  }

  async function fetchUnmasked(id) {
    const { data } = await client.get(`/api/backend/informants/${id}`)
    if (_cache[id]) {
      _cache[id].name        = data.name         ?? ''
      _cache[id].phone       = data.phone        ?? ''
      _cache[id].idNo        = data.idNo         ?? ''
      _cache[id].bankAccount = data.payoutAccount ?? ''
      // 審核歷程（admin-only）：GET {id} 回傳完整帳號操作記錄
      if (data.history?.length) {
        _cache[id].reviewHistory = data.history.map(h => ({
          time:  h.time  ?? '',
          text:  h.text  ?? '',
          actor: h.actor ?? null,
        }))
      }
    }
  }

  async function adjustReputation(id, delta, reason) {
    const { data } = await client.post(`/api/backend/informants/${id}/reputation`, { delta, reason })
    if (_cache[id]) {
      const prev = _cache[id].reputation.score ?? 50
      const next = data.reputationScore ?? Math.max(0, Math.min(100, prev + delta))
      _cache[id].reputation.score = next
      _cache[id].reviewHistory.push({
        time:  _now(),
        text:  `信譽分調整 ${delta > 0 ? '+' : ''}${delta}（${reason}）[${prev} → ${next}]`,
        actor: '後台人員',
      })
    }
  }

  return {
    informants, searching, getById,
    search, fetchProfile, fetchUnmasked,
    suspend, reinstate, remove, settle, debit, adjustReputation,
  }
})
