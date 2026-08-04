import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client, { BASE_URL } from '../api/client'

// audit action → { tag, text, link, navTo }
const ACTION_MAP = {
  EventCreated:       e => ({ tag: 'ev',    text: `E-${e.targetId} 新事件建立・未確認上圖`,                  link: '地圖', navTo: null }),
  EventVerified:      e => ({ tag: 'ev',    text: `E-${e.targetId} 升已驗證`,                                link: '地圖', navTo: null }),
  EventStatusChanged: e => ({ tag: 'ev',    text: `E-${e.targetId} 狀態變更`,                                link: '詳情', navTo: `/op2/${e.targetId}` }),
  EventTakenDown:     e => ({ tag: 'human', text: `E-${e.targetId} 人工下架・已留跡`,                        link: '詳情', navTo: `/op2/${e.targetId}` }),
  EventExtended:      e => ({ tag: 'human', text: `E-${e.targetId} TTL 延長`,                                link: '詳情', navTo: `/op2/${e.targetId}` }),
  EventDispatched:    e => ({ tag: 'human', text: `E-${e.targetId} 轉內部派遣`,                              link: '詳情', navTo: `/op2/${e.targetId}` }),
  TaskCreated:        e => ({ tag: 'task',  text: `T-${e.targetId} 任務廣播`,                                link: '地圖', navTo: null }),
  TaskEscalated:      e => ({ tag: 'task',  text: `T-${e.targetId} 逾時無人接・半徑放大重新廣播`,            link: '地圖', navTo: null }),
  TaskAccepted:       e => ({ tag: 'task',  text: `T-${e.targetId} 情報員 GI-${pad(e.actorId)} 接單・鎖定`, link: '地圖', navTo: null }),
  TaskAbandoned:      e => ({ tag: 'task',  text: `T-${e.targetId} 棄單`,                                    link: '地圖', navTo: null }),
  TaskCompleted:      e => ({ tag: 'task',  text: `T-${e.targetId} 查核完成`,                                link: '地圖', navTo: null }),
  PipelineAlert:      e => ({ tag: 'alert', text: '管線告警—請確認七源狀態',                                 link: '詳情', navTo: null }),
  AbuseDetected:      e => ({ tag: 'abuse', text: '反濫用偵測・裝置異常警示',                                link: '詳情', navTo: '/op7' }),
  DeviceBlocked:      e => ({ tag: 'abuse', text: `裝置封鎖`,                                                link: '詳情', navTo: '/op7' }),
  InformantSuspended: e => ({ tag: 'human', text: `GI-${pad(e.targetId)} 停權`,                              link: '詳情', navTo: `/op4/${e.targetId}` }),
  InformantRemoved:   e => ({ tag: 'human', text: `GI-${pad(e.targetId)} 除名`,                              link: '詳情', navTo: `/op4/${e.targetId}` }),
  RedemptionVerified: e => ({ tag: 'human', text: `RD-${e.targetId} 兌換核對凍結`,                          link: '詳情', navTo: '/op8' }),
}

function pad(id) { return String(id).padStart(4, '0') }

function mapAuditToLog(audit) {
  const mapper = ACTION_MAP[audit.action]
  const mapped = mapper
    ? mapper(audit)
    : {
        tag: audit.actorType === 'Operator' ? 'human' : 'ev',
        text: `${audit.action}（${audit.targetType} #${audit.targetId}）`,
        link: '詳情',
        navTo: null,
      }
  const d = new Date(audit.at)
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
  return { ...mapped, id: audit.id, time, isNew: false }
}

export const useLogsStore = defineStore('logs', () => {
  const logs      = ref([])
  const activeTag = ref('all')
  let abortCtrl   = null
  let pollTimer   = null
  const seenIds   = new Set()

  const visibleLogs = computed(() =>
    activeTag.value === 'all'
      ? logs.value
      : logs.value.filter(l => l.tag === activeTag.value)
  )

  function setTag(tag) { activeTag.value = tag }

  function pushLog(entry) {
    if (seenIds.has(entry.id)) return
    seenIds.add(entry.id)
    logs.value.unshift({ ...entry, isNew: true })
    setTimeout(() => {
      const l = logs.value.find(x => x.id === entry.id)
      if (l) l.isNew = false
    }, 500)
    if (logs.value.length > 200) logs.value.splice(200)
  }

  async function loadInitial() {
    try {
      const { data } = await client.get('/api/backend/dashboard/activity?limit=50')
      ;[...data].reverse().forEach(a => {
        const entry = mapAuditToLog(a)
        if (!seenIds.has(entry.id)) {
          seenIds.add(entry.id)
          logs.value.unshift(entry)
        }
      })
    } catch {}
  }

  function startPoll() {
    pollTimer = setInterval(async () => {
      try {
        const { data } = await client.get('/api/backend/dashboard/activity?limit=20')
        data.forEach(a => pushLog(mapAuditToLog(a)))
      } catch {}
    }, 5000)
  }

  async function connect() {
    await loadInitial()
    abortCtrl = new AbortController()
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${BASE_URL}/api/backend/dashboard/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: abortCtrl.signal,
      })
      if (!res.ok) throw new Error(`SSE ${res.status}`)
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop()
        for (const chunk of parts) {
          const line = chunk.split('\n').find(l => l.startsWith('data:'))
          if (line) {
            try { pushLog(mapAuditToLog(JSON.parse(line.slice(5).trim()))) } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') startPoll()
    }
  }

  function disconnect() {
    abortCtrl?.abort()
    abortCtrl = null
    clearInterval(pollTimer)
    pollTimer = null
  }

  return { logs, activeTag, visibleLogs, setTag, pushLog, connect, disconnect }
})
