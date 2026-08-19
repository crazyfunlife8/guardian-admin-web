import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import client from '../api/client'

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

// TODO(後端): qualType enum 值若有新增請同步更新此對照表
const QUAL_LABELS = {
  motorcycle_courier: '機車外送員',
}

function mapListItem(d) {
  return {
    id:         String(d.id),
    state:      d.state ?? '',    // TODO(後端): state enum 值未在 OpenAPI 中定義
    qualType:   d.qualType ?? '',
    qualLabel:  QUAL_LABELS[d.qualType] ?? d.qualType ?? '',
    certFileUrl: d.certFileUrl ?? null,
    submittedAt: formatAgo(d.appliedAt),
  }
}

function mapDetail(d) {
  return {
    id:            String(d.id),
    state:         d.state ?? '',   // TODO(後端): state enum 值未在 OpenAPI 中定義
    name:          d.name ?? '',
    phone:         d.phone ?? '',
    idNo:          d.idNo ?? '',
    payoutAccount: d.payoutAccount ?? '',
    email:         d.email ?? '',
    qualType:      d.qualType ?? '',
    qualLabel:     QUAL_LABELS[d.qualType] ?? d.qualType ?? '',
    certFileUrl:   d.certFileUrl ?? null,
    submittedAt:   formatAgo(d.appliedAt),
    history:       (d.history ?? []).map(h => ({
      time:  h.time  ?? '',
      text:  h.text  ?? '',
      actor: h.actor ?? null,
    })),
    // TODO(後端): plateSuffix, zone 欄位 API 未定義（缺口 #18）
  }
}

export const useReviewStore = defineStore('review', () => {
  const applications = ref([])
  const details      = reactive({})   // id(string) → detail object
  const filterState  = ref('all')
  const selectedId   = ref(null)
  const loading      = ref(false)

  const filteredApps = computed(() => {
    if (filterState.value === 'all') return applications.value
    return applications.value.filter(a => a.state === filterState.value)
  })

  const selectedApp = computed(() => details[selectedId.value] ?? null)

  function setFilter(key) { filterState.value = key }

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
      const { data } = await client.get('/api/backend/informants/applications')
      applications.value = data.map(mapListItem)
      if (!selectedId.value && applications.value.length) {
        select(applications.value[0].id)
      }
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
    if (details[id]) {
      details[id].state = action === 'approve' ? 'approved_pending' : 'rejected'
    }
    const listItem = applications.value.find(a => a.id === id)
    if (listItem) listItem.state = action === 'approve' ? 'approved_pending' : 'rejected'
  }

  return {
    applications, filterState, selectedId, filteredApps, selectedApp, loading,
    setFilter, select, load, applyReviewAction,
  }
})
