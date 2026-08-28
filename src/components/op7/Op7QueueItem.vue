<template>
  <li :class="{ sel: selected }" @click="$emit('select', item.id)">
    <div class="q-row1">
      <span class="cid">{{ item.id }}</span>
      <StatusBadge class="q-badge" :label="STATUS_LABELS[item.status]" :variant="STATUS_VARIANTS[item.status]" />
    </div>
    <div class="q-row2">
      <span class="mono">{{ item.informantId ?? item.sourceId }}</span>
      <span class="mono">{{ item.triggeredAt }}</span>
    </div>
    <div class="q-rule">{{ item.rule }}</div>
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
  pending:   '待覆核',
  confirmed: '確認停權',
  cleared:   '誤判解除',
}
const STATUS_VARIANTS = {
  pending:   'wait',
  confirmed: 'danger',
  cleared:   'ok',
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

.cid {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.q-row2 {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}
.mono { font-family: var(--mono); }

.q-rule {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
