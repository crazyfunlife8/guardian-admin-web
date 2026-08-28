<template>
  <li class="result-item" @click="$emit('select', item.id)">
    <span class="iid">{{ item.informantNo || item.id }}</span>
    <span class="masked-name">●●●</span>
    <StatusBadge :label="STATUS_LABELS[item.status]" :variant="STATUS_VARIANTS[item.status]" />
    <span class="joined mono">{{ item.joinedAt }}</span>
    <span class="arrow">→</span>
  </li>
</template>

<script setup>
import StatusBadge from '../shared/StatusBadge.vue'

defineProps({
  item: { type: Object, required: true },
})
defineEmits(['select'])

const STATUS_LABELS   = { Pending: '審核中', Approved: '待綁定', Active: '正常', Suspended: '停權', Removed: '除名待結清', Cleared: '已結清' }
const STATUS_VARIANTS = { Pending: 'wait',   Approved: 'wait',    Active: 'ok',    Suspended: 'danger',  Removed: 'danger',   Cleared: 'danger'  }
</script>

<style scoped>
.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background .12s;
}
.result-item:hover { background: var(--bg-panel-raised); }

.iid {
  font-family: var(--mono);
  font-size: 15px;
  font-weight: 600;
  min-width: 90px;
}
.masked-name {
  font-family: var(--mono);
  color: var(--mask);
  flex: 1;
  letter-spacing: 2px;
}
.joined {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 100px;
}
.arrow {
  color: var(--accent);
  font-size: 14px;
}
</style>
