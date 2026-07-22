<template>
  <aside class="todo" :class="{ collapsed }">
    <div class="panel-head">
      <h2>待辦</h2>
      <button class="collapse" @click="collapsed = !collapsed">
        {{ collapsed ? '展開 ›' : '收合 ‹' }}
      </button>
    </div>
    <ul v-if="!collapsed">
      <li
        v-for="item in items"
        :key="item.key"
        @click="item.route ? router.push(item.route) : $emit('item-click', item.key)"
      >
        <span class="name">{{ item.label }}</span>
        <span>
          <span class="badge" :class="badgeClass(item.count)">{{ item.count }}</span>
          <span class="arrow">→</span>
        </span>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineEmits(['item-click'])
const router = useRouter()

const collapsed = ref(false)

const items = ref([
  { key: 'qualification', label: '資格審核',       count: 3, route: '/op3' },
  { key: 'appeal',        label: '申訴與檢舉',     count: 1, route: '/op5' },
  { key: 'redemption',    label: '兌換核銷',       count: 5, route: '/op8' },
  { key: 'overdue-task',  label: '逾時無人接任務', count: 2, route: null },
  { key: 'stale',         label: '久未複查掛點',   count: 4, route: null },
  { key: 'mismatch',      label: '異常配對',       count: 0, route: '/op7' },
  { key: 'pipeline',      label: '管線告警',       count: 1, route: '/op7' },
])

function badgeClass(count) {
  if (count === 0) return 'zero'
  if (count >= 2 && ['overdue-task', 'pipeline'].includes) return 'danger'
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
.todo.collapsed { width: auto; }

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}
.panel-head h2 { font-size: 18px; font-weight: 600; }
.collapse {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--sans);
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
</style>
