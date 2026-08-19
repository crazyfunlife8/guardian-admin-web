import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

function mapProfile(data) {
  return {
    id:          String(data.id),
    informantNo: data.informantNo ?? '',
    state:       data.state ?? '',              // TODO(後端): state enum 值未在 OpenAPI 中定義
    reputation: {
      score:        data.reputationScore ?? null,
      accuracy30d:  null,                       // TODO(後端): profile endpoint 未提供
      falseReports: 0,                          // TODO(後端): profile endpoint 未提供
    },
    qualType:   data.qualType ?? '',
    qualStatus: data.qualStatus ?? '',
    reviewHistory: (data.reputationHistory ?? []).map(h => ({
      time:  h.createdAt ? new Date(h.createdAt).toLocaleDateString('zh-TW') : '',
      text:  `信譽分 ${h.delta >= 0 ? '+' : ''}${h.delta}（${h.reason ?? ''}）`,
      actor: null,
    })),
    // 以下欄位 API 尚未提供
    name:        '',          // TODO(後端): profile endpoint 不含個資明文
    phoneSuffix: '',          // TODO(後端): 待後端補充個資摘要
    idSuffix:    '',
    bankAccount: '',
    joinedAt:    '',
    taskSummary: null,        // TODO(後端): 待補端點（#8）
    // BalanceResponse 欄位：available/frozen/deferred（#12）
    balance: { available: 0, frozen: 0, deferred: 0 },       // TODO(後端): profile endpoint 尚未包含 balance
    appealHistory: [],        // TODO(後端): 待補端點（#9）
    tags: { system: [] },     // TODO(後端): 待補端點（#11）
  }
}

export const useInformantsStore = defineStore('informants', () => {
  const informants = ref([])     // summary list for search
  const searching  = ref(false)
  const _cache     = reactive({}) // id → full profile

  function getById(id) {
    return _cache[id] ?? null
  }

  async function search(q = '') {
    if (!q.trim()) {
      informants.value = []
      return
    }
    try {
      searching.value = true
      const { data } = await client.get('/api/backend/informants', { params: { q } })
      informants.value = (data ?? []).map(d => ({
        id:       d.informantNo ?? String(d.id),
        status:   d.state ?? '',
        joinedAt: d.joinedAt ? new Date(d.joinedAt).toLocaleDateString('zh-TW') : '',
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
      _cache[id].state = 'suspended'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號停權（${reason}）`, actor: '後台人員' })
    }
  }

  async function reinstate(id, reason) {
    await client.post(`/api/backend/informants/${id}/reinstate`, { reason })
    if (_cache[id]) {
      _cache[id].state = 'active'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號恢復（${reason}）`, actor: '後台人員' })
    }
  }

  async function remove(id, reason) {
    await client.post(`/api/backend/informants/${id}/remove`, { reason })
    if (_cache[id]) {
      _cache[id].state = 'removed'
      _cache[id].reviewHistory.push({ time: _now(), text: `帳號除名（${reason}）`, actor: '後台人員' })
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
    search, fetchProfile,
    suspend, reinstate, remove, adjustReputation,
  }
})
