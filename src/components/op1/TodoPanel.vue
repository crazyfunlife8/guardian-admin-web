<template>
  <aside class="todo" :class="{ collapsed, theater: theaterMode }">
    <div class="panel-head">
      <h2>
        待辦
        <span v-if="collapsed && totalCount > 0" class="badge warn">{{ totalCount }}</span>
      </h2>
      <button class="collapse" @click="collapsed = !collapsed">
        {{ collapsed ? '展開 ›' : '收合 ‹' }}
      </button>
    </div>
    <ul v-if="!collapsed">
      <template v-for="item in activeItems" :key="item.key">
        <!-- 一般列（直接導向） -->
        <li v-if="!item.expandable" @click="item.route ? router.push(item.route) : null">
          <span class="name">{{ item.label }}</span>
          <span>
            <span class="badge" :class="badgeClass(item.count, item.key)">{{ item.count }}</span>
            <span class="arrow">→</span>
          </span>
        </li>

        <!-- 可展開列 -->
        <template v-else>
          <li class="expandable-row" @click="toggleExpand(item.key)">
            <span class="name">{{ item.label }}</span>
            <span>
              <span class="badge" :class="badgeClass(item.count, item.key)">{{ item.count }}</span>
              <span class="arrow">{{ expandedKey === item.key ? '▲' : '▼' }}</span>
            </span>
          </li>
          <li v-if="expandedKey === item.key" class="expand-panel">
            <div v-if="listLoading" class="list-loading">載入中…</div>
            <div v-else-if="currentList.length === 0" class="list-empty">暫無項目</div>
            <div v-else class="list-scroll">
              <!-- 逾時無人接 -->
              <template v-if="item.key === 'overdue-task'">
                <div v-for="t in currentList" :key="t.taskId" class="list-item">
                  <span class="li-id mono">任務 #{{ t.taskId }}</span>
                  <span class="li-sub">{{ t.eventType }} · {{ t.broadcastRadius }}m</span>
                </div>
              </template>
              <!-- 派單前存活不足 -->
              <template v-else-if="item.key === 'dispatch-blocked'">
                <div v-for="e in currentList" :key="e.eventId" class="list-item">
                  <div class="li-row">
                    <span class="li-id mono">事件 #{{ e.eventId }}</span>
                    <span class="li-sub">{{ e.eventType }} · {{ e.adminAreaCode }}</span>
                  </div>
                  <button
                    class="btn-dismiss"
                    :disabled="dismissingId === e.eventId"
                    @click.stop="dismiss(e.eventId)"
                  >{{ dismissingId === e.eventId ? '處理中…' : '放掉' }}</button>
                </div>
              </template>
              <!-- 久未複查 -->
              <template v-else-if="item.key === 'stale'">
                <div v-for="e in currentList" :key="e.eventId" class="list-item">
                  <span class="li-id mono">事件 #{{ e.eventId }}</span>
                  <span class="li-sub">{{ e.eventType }} · {{ e.adminAreaCode }}</span>
                </div>
              </template>
            </div>
          </li>
        </template>
      </template>

      <li v-if="activeItems.length === 0" class="empty">
        <span class="name">暫無待辦事項</span>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../stores/dashboard'

defineProps({ theaterMode: { type: Boolean, default: false } })
defineEmits(['item-click'])

const router    = useRouter()
const store     = useDashboardStore()
const collapsed = ref(false)
const { todo, unacceptedTasks, dispatchBlockedList, staleVerifiedList } = storeToRefs(store)

const expandedKey  = ref(null)
const listLoading  = ref(false)
const dismissingId = ref(null)

const DANGER_KEYS = new Set(['overdue-task', 'pipeline'])

const items = computed(() => [
  { key: 'qualification',    label: '資格審核',       count: todo.value.qualificationReview,     route: '/op3',  expandable: false },
  { key: 'appeal',           label: '申訴與檢舉',     count: todo.value.openTickets,             route: '/op5',  expandable: false },
  { key: 'redemption',       label: '兌換核銷',       count: todo.value.redemptionPendingReview, route: '/op8',  expandable: false },
  { key: 'overdue-task',     label: '逾時無人接任務', count: todo.value.expiredUnacceptedTasks,  route: null,    expandable: true  },
  { key: 'dispatch-blocked', label: '派單前存活不足', count: todo.value.dispatchBlockedEvents,   route: null,    expandable: true  },
  { key: 'stale',            label: '久未複查掛點',   count: todo.value.staleVerifiedEvents,     route: null,    expandable: true  },
  { key: 'suspicious',       label: '可疑覆核',       count: todo.value.suspiciousObservations,  route: '/op7',  expandable: false },
  { key: 'mismatch',         label: '異常配對',       count: todo.value.abnormalPairings,        route: '/op7',  expandable: false },
  { key: 'pipeline',         label: '管線告警',       count: todo.value.pipelineAlerts,          route: '/op7',  expandable: false },
])

const activeItems = computed(() => items.value.filter(i => i.count > 0))
const totalCount  = computed(() => items.value.reduce((sum, i) => sum + (i.count || 0), 0))

const currentList = computed(() => {
  if (expandedKey.value === 'overdue-task')     return unacceptedTasks.value
  if (expandedKey.value === 'dispatch-blocked') return dispatchBlockedList.value
  if (expandedKey.value === 'stale')            return staleVerifiedList.value
  return []
})

async function toggleExpand(key) {
  if (expandedKey.value === key) {
    expandedKey.value = null
    return
  }
  expandedKey.value = key
  listLoading.value = true
  try {
    if (key === 'overdue-task')     await store.fetchUnacceptedTasks()
    if (key === 'dispatch-blocked') await store.fetchDispatchBlockedList()
    if (key === 'stale')            await store.fetchStaleVerifiedList()
  } catch (_) {}
  listLoading.value = false
}

async function dismiss(eventId) {
  dismissingId.value = eventId
  try {
    await store.dismissDispatchBlocked(eventId)
  } catch (_) {}
  dismissingId.value = null
}

function badgeClass(count, key) {
  if (count === 0) return 'zero'
  if (DANGER_KEYS.has(key)) return 'danger'
  return 'warn'
}
</script>

<style scoped>
.todo {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 280px;
  background: rgba(21, 28, 38, .92);
  border: 1px solid var(--line);
  border-radius: 10px;
  backdrop-filter: blur(6px);
  z-index: 20;
}


.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}
.panel-head h2 { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
li.empty { cursor: default; color: var(--text-secondary); font-size: 13px; }
li.empty:hover { background: none; }
.collapse {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--sans);
  padding-left: 8px;
}

ul { list-style: none; }
li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(42, 53, 71, .5);
  cursor: pointer;
  transition: background .15s;
}
li:last-child { border-bottom: none; }
li:hover { background: var(--bg-panel-raised); }
li .arrow { color: var(--text-secondary); font-size: 12px; margin-left: 6px; }

.expandable-row .arrow { opacity: 1; }

.expand-panel {
  display: block;
  padding: 0;
  cursor: default;
  background: var(--bg-base);
}
.expand-panel:hover { background: var(--bg-base); }

.list-loading,
.list-empty {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.list-scroll {
  max-height: 200px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(42, 53, 71, .3);
  font-size: 13px;
  gap: 8px;
}
.list-item:last-child { border-bottom: none; }
.li-row { display: flex; flex-direction: column; gap: 2px; }
.li-id  { font-family: var(--mono); color: var(--text-primary); }
.li-sub { font-size: 12px; color: var(--text-secondary); }

.btn-dismiss {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--sans);
}
.btn-dismiss:hover:not(:disabled) { background: var(--bg-panel-raised); color: var(--text-primary); }
.btn-dismiss:disabled { opacity: .4; cursor: not-allowed; }

.badge {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
  border-radius: 999px;
  padding: 2px 9px;
  display: inline-block;
}
.badge.warn   { background: var(--warn);   color: #1A1405; }
.badge.danger { background: var(--danger); color: #fff; }
.badge.zero   { background: none; border: 1px solid var(--line); color: var(--text-secondary); font-weight: 400; }

.todo.theater { width: 320px; }
.todo.theater .panel-head h2 { font-size: 22px; }
.todo.theater li { padding: 14px 20px; }
.todo.theater .name { font-size: 16px; }
.todo.theater .badge { font-size: 22px; min-width: 42px; padding: 4px 12px; }
</style>
