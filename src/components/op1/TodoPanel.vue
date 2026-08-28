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
      <li
        v-for="item in activeItems"
        :key="item.key"
        @click="item.route ? router.push(item.route) : $emit('item-click', item.key)"
      >
        <span class="name">{{ item.label }}</span>
        <span>
          <span class="badge" :class="badgeClass(item.count, item.key)">{{ item.count }}</span>
          <span class="arrow">→</span>
        </span>
      </li>
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

const router = useRouter()
const collapsed = ref(false)
const { todo } = storeToRefs(useDashboardStore())

const DANGER_KEYS = new Set(['overdue-task', 'pipeline'])

const items = computed(() => [
  { key: 'qualification', label: '資格審核',       count: todo.value.qualificationReview,     route: '/op3' },
  { key: 'appeal',        label: '申訴與檢舉',     count: todo.value.openTickets,             route: '/op5' },
  { key: 'redemption',    label: '兌換核銷',       count: todo.value.redemptionPendingReview, route: '/op8' },
  { key: 'overdue-task',  label: '逾時無人接任務', count: todo.value.expiredUnacceptedTasks,  route: null   },
  { key: 'stale',         label: '久未複查掛點',   count: todo.value.staleVerifiedEvents,     route: null   },
  { key: 'suspicious',    label: '可疑覆核',       count: todo.value.suspiciousObservations,  route: '/op7' },
  { key: 'mismatch',      label: '異常配對',       count: todo.value.abnormalPairings,        route: '/op7' },
  { key: 'pipeline',      label: '管線告警',       count: todo.value.pipelineAlerts,          route: '/op7' },
])

const activeItems = computed(() => items.value.filter(i => i.count > 0))
const totalCount = computed(() => items.value.reduce((sum, i) => sum + (i.count || 0), 0))

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
li .arrow { color: var(--text-secondary); font-size: 12px; opacity: 0; transition: opacity .15s; margin-left: 6px; }
li:hover .arrow { opacity: 1; }

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
