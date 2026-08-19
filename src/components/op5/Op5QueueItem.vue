<template>
  <li :class="{ sel: selected }" @click="$emit('select', item.id)">
    <div class="q-row1">
      <span class="aid">{{ item.id }}</span>
      <span class="type-tag">{{ item.typeLabel }}</span>
      <StatusBadge class="q-badge" :label="STATUS_LABELS[item.status]" :variant="STATUS_VARIANTS[item.status]" />
    </div>
    <div class="q-row2">
      <span class="mono">{{ item.relatedId ? `E-${item.relatedId}` : '—' }}</span>
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

// TODO(後端): SupportTicketStatus enum 值為 Open/InProgress/Resolved
const STATUS_LABELS = {
  Open:       '待處理',
  InProgress: '調查中',
  Resolved:   '已結案',
}
const STATUS_VARIANTS = {
  Open:       'wait',
  InProgress: 'info',
  Resolved:   'ok',
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

.q-row1 { display: flex; align-items: center; gap: 8px; }
:deep(.q-badge) { margin-left: auto; }

.aid { font-family: var(--mono); font-size: 13px; font-weight: 600; }
.type-tag {
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
  white-space: nowrap;
}
.q-row2 { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
.mono { font-family: var(--mono); }
</style>
