<template>
  <li
    :class="{ sel: selected }"
    @click="$emit('select', item.id)"
  >
    <div class="q-row1">
      <span class="oid">{{ item.id }}</span>
      <span class="src-tag">{{ item.source }}</span>
      <StatusBadge class="op-8-badge" :label="STATE_LABELS[item.state]" :variant="STATE_VARIANTS[item.state]" />
    </div>
    <div class="q-row2">
      <span>{{ item.informantId }}</span>
      <span>{{ item.rewardType }} <span class="mono">{{ item.amount }}</span></span>
      <span class="mono">{{ item.time }}</span>
    </div>
  </li>
</template>

<script setup>
import StatusBadge from '../shared/StatusBadge.vue'

defineProps({
  item:     { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['select'])

const STATE_LABELS = {
  wait:    '待核對',
  checked: '已核對',
  issued:  '已發放・待扣除',
  hold:    '掛起（停權）',
  done:    '已結清',
  reject:  '已拒',
}
const STATE_VARIANTS = {
  wait:    'wait',
  checked: 'checked',
  issued:  'issued',
  hold:    'hold',
  done:    'ok',
  reject:  'danger',
}
</script>

<style scoped>
li {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(42,53,71,.5);
  cursor: pointer;
  display: grid;
  gap: 5px;
  transition: background .12s;
}
li:hover { background: var(--bg-panel-raised); }
li.sel   { background: var(--bg-panel-raised); box-shadow: inset 3px 0 0 var(--accent); }

.q-row1 { display: flex; align-items: center; gap: 10px; }
:deep(.op-8-badge) { margin-left: auto; }
.oid    { font-family: var(--mono); font-size: 14px; font-weight: 600; }
.src-tag {
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
}
.q-row2 { display: flex; gap: 14px; font-size: 13px; color: var(--text-secondary); }
.mono   { font-family: var(--mono); }
</style>
