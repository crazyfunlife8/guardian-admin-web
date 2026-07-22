<template>
  <li :class="{ sel: selected }" @click="$emit('select', item.id)">
    <div class="q-row1">
      <span class="aid">{{ item.id }}</span>
      <StatusBadge class="q-badge" :label="STATUS_LABELS[item.status]" :variant="STATUS_VARIANTS[item.status]" />
    </div>
    <div class="q-row2">
      <span>{{ item.name }}</span>
      <span class="mono">{{ item.submittedAt }}</span>
    </div>
  </li>
</template>

<script setup>
import StatusBadge from '../shared/StatusBadge.vue'

defineProps({
  item:     { type: Object,  required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['select'])

const STATUS_LABELS = {
  pending:  '待審核',
  approved: '已通過',
  rejected: '已拒絕',
}
const STATUS_VARIANTS = {
  pending:  'wait',
  approved: 'ok',
  rejected: 'danger',
}
</script>

<style scoped>
li {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(42, 53, 71, .5);
  cursor: pointer;
  display: grid;
  gap: 5px;
  transition: background .12s;
}
li:hover { background: var(--bg-panel-raised); }
li.sel   { background: var(--bg-panel-raised); box-shadow: inset 3px 0 0 var(--accent); }

.q-row1 { display: flex; align-items: center; gap: 10px; }
:deep(.q-badge) { margin-left: auto; }

.aid  { font-family: var(--mono); font-size: 14px; font-weight: 600; }
.q-row2 { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
.mono { font-family: var(--mono); }
</style>
