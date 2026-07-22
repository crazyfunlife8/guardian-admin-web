<!-- B型頁首身分列：事件版本
  顯示：類型圖標 + 事件ID(Mono大字) + 狀態徽章 + 路段 + TTL + 來源
-->
<template>
  <div class="identity-bar">
    <div class="id-row">
      <MarkerIcon :type="event.type" :status="event.status" :size="28" />
      <h2>{{ event.id }}</h2>
      <StatusBadge :label="STATUS_LABELS[event.status]" :variant="statusVariant" />
      <span v-if="isTerminated" class="terminated-note">此事件已終結，不可再操作</span>
    </div>
    <div class="meta-row">
      <span class="type-label">{{ TYPE_LABELS[event.type] }}</span>
      <span class="sep">・</span>
      <span>{{ event.road }}</span>
      <span class="sep">｜</span>
      <span class="freshness">最新回報 <b>{{ event.reportedAgo }}</b></span>
      <template v-if="event.ttlMin != null">
        <span class="sep">｜</span>
        <span :class="{ 'ttl-warn': event.ttlMin <= 10 }">
          TTL 剩餘 <b class="mono">{{ event.ttlMin }} 分</b>
        </span>
      </template>
      <span class="sep">｜</span>
      <span class="source">來源：{{ event.source }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkerIcon  from '../op1/MarkerIcon.vue'
import StatusBadge from '../shared/StatusBadge.vue'

const props = defineProps({ event: { type: Object, required: true } })

const TYPE_LABELS   = { inspection: '臨時路檢', accident: '事故', construction: '施工', control: '管制' }
const STATUS_LABELS = { unverified: '未確認', verified: '已驗證', cleared: '已終結' }

const statusVariant = computed(() => ({
  unverified: 'wait', verified: 'ok', cleared: 'zero',
}[props.event.status] ?? 'zero'))

const isTerminated = computed(() => props.event.status === 'cleared')
</script>

<style scoped>
.identity-bar {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 22px;
  display: grid;
  gap: 10px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
h2 {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 600;
}
.terminated-note {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px dashed var(--line);
  border-radius: 999px;
  padding: 3px 14px;
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--text-secondary);
  gap: 2px;
}
.type-label { color: var(--text-primary); font-weight: 500; }
.sep { opacity: .5; margin: 0 4px; }
.freshness b, .source { color: var(--text-primary); }
.mono { font-family: var(--mono); }
.ttl-warn b { color: var(--danger); }
</style>
