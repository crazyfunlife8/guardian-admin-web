import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import client, { BASE_URL } from '../api/client'

function formatAgo(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1)  return '剛剛'
  if (mins < 60) return `${mins} 分鐘前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} 小時前`
  return `${Math.floor(hrs / 24)} 天前`
}

const QUAL_LABELS = {
  motorcycle_courier: '機車外送員',
  delivery:           '外送員',
}

function mapListItem(d) {
  return {
    id:            String(d.id),
    state:         API_STATE_TO_UI[d.state] ?? d.state ?? '',
    qualType:      d.qualType ?? '',
    qualLabel:     QUAL_LABELS[d.qualType] ?? d.qualType ?? '',
    certFileCount: d.certFileCount ?? 0,
    submittedAt:   formatAgo(d.appliedAt),
  }
}

function mapDetail(d) {
  return {
    id:            String(d.id),
    state:         API_STATE_TO_UI[d.state] ?? d.state ?? '',
    name:          d.name ?? '',
    phone:         d.phone ?? '',
    idNo:          d.idNo ?? '',
    payoutAccount: d.payoutAccount ?? '',
    email:         d.email ?? '',
    qualType:      d.qualType ?? '',
    qualLabel:     QUAL_LABELS[d.qualType] ?? d.qualType ?? '',
    certFileCount: d.certFileCount ?? 0,
    submittedAt:   formatAgo(d.appliedAt),
    history:       (d.history ?? []).map(h => ({
      time:  h.time  ?? '',
      text:  h.text  ?? '',
      actor: h.actor ?? null,
    })),
  }
}

// 前端 filter key → API state 參數對照（不帶 state 時後端只回 Pending）
const STATE_MAP = {
  pending: null,     // 不帶 state 參數
  active:  'Active',
}

// API state 值 → 前端 UI key 對照
const API_STATE_TO_UI = {
  Pending: 'pending',
  Active:  'active',
}

export const useReviewStore = defineStore('review', () => {
  const applications = ref([])
  const details      = reactive({})   // id(string) → detail object
  const filterState  = ref('pending')
  const selectedId   = ref(null)
  const loading      = ref(false)

  const filteredApps = computed(() => applications.value)

  const selectedApp = computed(() => details[selectedId.value] ?? null)

  function setFilter(key) {
    filterState.value = key
    selectedId.value  = null
    load()
  }

  async function select(id) {
    selectedId.value = id
    if (id && !details[id]) {
      try {
        const { data } = await client.get(`/api/backend/informants/${id}`)
        details[id] = mapDetail(data)
      } catch (err) {
        console.error('fetch application detail failed', err)
      }
    }
  }

  async function load() {
    loading.value = true
    try {
      const stateParam = STATE_MAP[filterState.value]
      const params = stateParam ? { state: stateParam } : {}
      const { data } = await client.get('/api/backend/informants/applications', { params })
      applications.value = data.map(mapListItem)
      if (applications.value.length) select(applications.value[0].id)
    } catch (err) {
      console.error('load applications failed', err)
    } finally {
      loading.value = false
    }
  }

  async function applyReviewAction(id, action, reason) {
    const url = action === 'approve'
      ? `/api/backend/informants/${id}/approve`
      : `/api/backend/informants/${id}/reject`
    const body = action === 'approve' ? { basis: reason } : { reason }
    await client.post(url, body)
    // 核准 → 直接開通；駁回 → 申請刪除。兩者都從目前佇列移除
    applications.value = applications.value.filter(a => a.id !== id)
    delete details[id]
    selectedId.value = applications.value[0]?.id ?? null
  }

  async function fetchCertFile(id, index) {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(`${BASE_URL}/api/backend/informants/${id}/cert-files/${index}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return URL.createObjectURL(await res.blob())
  }

  return {
    applications, filterState, selectedId, filteredApps, selectedApp, loading,
    setFilter, select, load, applyReviewAction, fetchCertFile,
  }
})
