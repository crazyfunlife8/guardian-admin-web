<template>
  <div v-if="event" class="evcard" :style="cardStyle">
    <div class="head">
      <component :is="MarkerIcon" :type="event.type" :status="event.status" :size="18" />
      <b>{{ TYPE_LABELS[event.type] }}</b>
      <span class="state" :class="event.status === 'unverified' ? 'warn' : 'ok'">
        {{ STATUS_LABELS[event.status] }}
      </span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="body">
      <span>路段：<b>{{ event.road }}</b></span>
      <span>最新回報：<b class="mono">{{ event.reportedAgo }}</b>・來源：{{ event.source }}</span>
      <span v-if="event.ttlMin">TTL 剩餘：<b class="mono">{{ event.ttlMin }} 分</b>
        <template v-if="event.taskStatus">・驗證任務：<b>{{ event.taskStatus }}</b></template>
      </span>
    </div>
    <details open>
      <summary>狀態機歷程</summary>
      <div class="hist">
        <div v-for="h in event.history" :key="h.time">
          <time>{{ h.time }}</time>{{ h.text }}
        </div>
      </div>
    </details>
    <div class="actions">
      <button class="btn primary" @click="act('confirm')">確認為真</button>
      <button class="btn" @click="act('false-report')">誤報下架</button>
      <button class="btn" @click="act('cleared')">已解除</button>
      <button class="btn" @click="act('dispatch')">轉派遣</button>
    </div>
    <div class="footer">
      <span class="note">任一處置動作皆須選填操作依據、自動留跡（C7）</span>
      <RouterLink :to="`/op2/${event.id}`" class="detail-link">完整詳情 →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkerIcon from './MarkerIcon.vue'

const props = defineProps({
  event: Object,
})
const emit = defineEmits(['close', 'action'])

const TYPE_LABELS   = { inspection: '臨時路檢', accident: '事故', construction: '施工', control: '管制' }
const STATUS_LABELS = { unverified: '未確認', verified: '已驗證', cleared: '已解除' }

const cardStyle = computed(() => {
  if (!props.event) return {}
  const x = parseFloat(props.event.x)
  const y = parseFloat(props.event.y)
  return {
    left: `${Math.min(x + 3, 72)}%`,
    top:  `${Math.max(y - 30, 2)}%`,
  }
})

function act(action) {
  emit('action', { eventId: props.event.id, action })
}
</script>

<style scoped>
.evcard {
  position: absolute;
  width: 320px;
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  z-index: 25;
  font-size: 14px;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}
.head b { font-size: 16px; flex: 1; }
.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
}
.close-btn:hover { color: var(--text-primary); }

.state {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 10px;
}
.state.warn { background: rgba(229, 184, 75, .15); color: var(--warn); border: 1px solid var(--warn); }
.state.ok   { background: rgba(63, 183, 126, .15); color: var(--ok);   border: 1px solid var(--ok); }

.body {
  padding: 12px 16px;
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
}
.body b { color: var(--text-primary); font-weight: 500; }
.body .mono { font-family: var(--mono); }

details {
  padding: 0 16px 10px;
  color: var(--text-secondary);
  font-size: 13px;
}
summary { cursor: pointer; padding: 4px 0; }
.hist {
  border-left: 2px solid var(--line);
  margin: 8px 0 4px 6px;
  padding-left: 12px;
  display: grid;
  gap: 8px;
}
.hist time { font-family: var(--mono); color: var(--text-secondary); margin-right: 8px; }

.actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--line);
}
.btn {
  flex: 1;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 9px 0;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--sans);
}
.btn:hover { background: var(--bg-panel); }
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #08111F;
  font-weight: 600;
}
.btn.primary:hover { filter: brightness(1.1); }

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
}
.note { font-size: 11px; color: var(--text-secondary); }
.detail-link { font-size: 12px; color: var(--accent); text-decoration: none; }
.detail-link:hover { text-decoration: underline; }
</style>
