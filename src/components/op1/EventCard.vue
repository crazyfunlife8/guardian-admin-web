<template>
  <div v-if="event" class="evcard" :style="cardStyle">
    <!-- 頭部 -->
    <div class="head">
      <component :is="MarkerIcon" :type="event.type" :status="event.status" :size="18" />
      <b>{{ TYPE_LABELS[event.type] }}</b>
      <span class="state" :class="statusClass(event.status)">
        {{ STATUS_LABELS[event.status] }}
      </span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- 資訊 -->
    <div class="body">
      <span v-if="event.road">路段：<b>{{ event.road }}</b></span>
      <span>最新回報：<b class="mono">{{ event.reportedAgo }}</b>・來源：{{ event.source }}</span>
      <span v-if="event.ttlMin != null">TTL 剩餘：<b class="mono">{{ event.ttlMin }} 分</b>
        <template v-if="event.taskStatus">・任務：<b>{{ TASK_LABELS[event.taskStatus] ?? event.taskStatus }}</b></template>
      </span>
    </div>

    <!-- 歷程 -->
    <details open>
      <summary>狀態機歷程</summary>
      <div class="hist">
        <div v-for="h in event.history" :key="h.time + h.text">
          <time>{{ h.time }}</time>{{ h.text }}
        </div>
      </div>
    </details>

    <!-- 操作依據 dialog（內嵌）-->
    <div v-if="pendingAction" class="basis-panel">
      <p class="basis-title">操作依據（必填）</p>
      <div class="basis-opts">
        <label v-for="opt in BASIS_OPTIONS" :key="opt.value" class="basis-opt">
          <input type="radio" :value="opt.value" v-model="basisChoice" />
          {{ opt.label }}
        </label>
      </div>
      <textarea
        v-if="basisChoice === 'other'"
        v-model="basisText"
        class="basis-textarea"
        placeholder="請說明依據..."
        rows="2"
      />
      <div class="basis-actions">
        <button class="btn" @click="cancelAction">取消</button>
        <button
          class="btn primary"
          :disabled="!canConfirm || submitting"
          @click="confirmAction"
        >{{ submitting ? '處理中…' : '確認送出' }}</button>
      </div>
    </div>

    <!-- 動作列 -->
    <div v-else class="actions">
      <button class="btn primary" @click="startAction('confirm')"
        :disabled="!canConfirm_status('confirm')">確認為真</button>
      <button class="btn" @click="startAction('false-report')"
        :disabled="!canConfirm_status('false-report')">誤報下架</button>
      <button class="btn" @click="startAction('cleared')"
        :disabled="!canConfirm_status('cleared')">已解除</button>
      <button class="btn" @click="startAction('dispatch')">轉派遣</button>
    </div>

    <!-- 頁尾 -->
    <div class="footer">
      <span class="note">任一處置動作皆須填寫操作依據（C7 自動留跡）</span>
      <RouterLink :to="`/op2/${event.id}`" class="detail-link">完整詳情 →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MarkerIcon from './MarkerIcon.vue'
import { TYPE_LABELS, STATUS_LABELS } from '../../stores/events'

const props = defineProps({
  event:    Object,
  clickPos: Object,
})
const emit = defineEmits(['close', 'action'])

// ── layout ──────────────────────────────────────────────────────────────────
const CARD_W = 320
const CARD_H = 480
const OFFSET = 16

const cardStyle = computed(() => {
  const p = props.clickPos
  if (!p) return { left: '20px', bottom: '260px' }
  const left = p.x + OFFSET + CARD_W < p.containerW ? p.x + OFFSET : p.x - CARD_W - OFFSET
  const top  = p.y + OFFSET + CARD_H < p.containerH ? p.y + OFFSET : p.y - CARD_H
  return { left: `${left}px`, top: `${top}px` }
})

// ── labels ───────────────────────────────────────────────────────────────────
const TASK_LABELS = {
  Broadcasting: '廣播中',
  Locked:       '已接單',
  Completed:    '已完成',
  Cancelled:    '已取消',
}

function statusClass(status) {
  if (status === 'Unconfirmed') return 'warn'
  if (status === 'Verified')    return 'ok'
  return 'muted'
}

// ── action state machine ─────────────────────────────────────────────────────
const ALLOWED = {
  confirm:        ['Unconfirmed'],
  'false-report': ['Unconfirmed', 'Verified'],
  cleared:        ['Unconfirmed', 'Verified'],
  dispatch:       ['Unconfirmed', 'Verified'],
}

function canConfirm_status(action) {
  return ALLOWED[action]?.includes(props.event?.status) ?? false
}

const BASIS_OPTIONS = [
  { value: 'internal',  label: '內部查核' },
  { value: 'multi-src', label: '多方反饋' },
  { value: 'correction', label: '來源更正' },
  { value: 'other',     label: '其他' },
]

const BASIS_LABELS = {
  internal:   '內部查核',
  'multi-src': '多方反饋',
  correction: '來源更正',
}

const pendingAction = ref(null)
const basisChoice   = ref('')
const basisText     = ref('')
const submitting    = ref(false)

const canConfirm = computed(() => {
  if (!basisChoice.value) return false
  if (basisChoice.value === 'other') return basisText.value.trim().length > 0
  return true
})

function startAction(action) {
  if (!canConfirm_status(action)) return
  pendingAction.value = action
  basisChoice.value   = ''
  basisText.value     = ''
}

function cancelAction() {
  pendingAction.value = null
}

async function confirmAction() {
  if (!canConfirm.value || submitting.value) return
  submitting.value = true
  const basis = basisChoice.value === 'other'
    ? basisText.value.trim()
    : BASIS_LABELS[basisChoice.value]
  try {
    await emit('action', { eventId: props.event.id, action: pendingAction.value, basis })
    pendingAction.value = null
  } finally {
    submitting.value = false
  }
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
  background: none; border: none; color: var(--text-secondary);
  cursor: pointer; font-size: 14px; padding: 2px 4px;
}
.close-btn:hover { color: var(--text-primary); }

.state {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 10px;
}
.state.warn  { background: rgba(229, 184, 75, .15); color: var(--warn); border: 1px solid var(--warn); }
.state.ok    { background: rgba(63, 183, 126, .15);  color: var(--ok);   border: 1px solid var(--ok); }
.state.muted { background: rgba(107, 122, 146, .15); color: var(--mask); border: 1px solid var(--mask); }

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

/* 操作依據 panel */
.basis-panel {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 10px;
}
.basis-title { font-size: 13px; font-weight: 600; color: var(--warn); }
.basis-opts { display: grid; gap: 6px; }
.basis-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.basis-opt input { accent-color: var(--accent); }
.basis-textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 8px 10px;
  resize: none;
}
.basis-actions {
  display: flex;
  gap: 8px;
}

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
.btn:hover:not(:disabled) { background: var(--bg-panel); }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #08111F;
  font-weight: 600;
}
.btn.primary:hover:not(:disabled) { filter: brightness(1.1); }

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
