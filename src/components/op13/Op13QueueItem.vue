<template>
  <li :class="{ sel: selected }" @click="$emit('select', item.id)">
    <div class="q-row1">
      <span class="aid">{{ item.id }}</span>
      <span class="type-tag" :class="TYPE_CHIP[item.type]">{{ item.type }}</span>
      <StatusBadge class="q-badge" :label="STATUS_LABELS[item.status]" :variant="STATUS_VARIANTS[item.status]" />
    </div>
    <div class="q-row2">
      <span class="desc">{{ item.description }}</span>
      <span class="mono time-text">{{ item.submittedAt }}</span>
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

const STATUS_LABELS   = { pending: '待處理', processing: '處理中', closed: '已結案' }
const STATUS_VARIANTS = { pending: 'wait',   processing: 'info',   closed: 'ok' }

const TYPE_CHIP = {
  '一般客服':       'type-accent',
  '申訴類・信譽異議': 'type-warn',
  '申訴類・除名異議': 'type-danger',
  '用戶檢舉':       'type-info',
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

.aid { font-family: var(--mono); font-size: 13px; font-weight: 600; flex-shrink: 0; }

.type-tag {
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.type-tag.type-warn    { color: var(--warn);   border-color: var(--warn); }
.type-tag.type-danger  { color: var(--danger); border-color: var(--danger); }
.type-tag.type-accent  { color: var(--accent); border-color: var(--accent); }
.type-tag.type-info    { color: var(--info);   border-color: var(--info); }

.q-row2 { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }

.desc {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.time-text { font-family: var(--mono); font-size: 12px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; }
</style>
