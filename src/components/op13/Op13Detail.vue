<template>
  <main class="detail" v-if="ticket">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ ticket.id }}</h2>
      <span class="type-chip" :class="TYPE_CHIP[ticket.type]">{{ ticket.type }}</span>
      <StatusBadge :label="STATUS_LABELS[ticket.status]" :variant="STATUS_VARIANTS[ticket.status]" />
      <span v-if="isTerminated" class="terminated-note">
        {{ ticket.status === 'closed' ? '已結案' : '已退單' }}，不可再操作
      </span>
    </div>

    <!-- 流轉條 -->
    <StateMachineBar :steps="steps" />

    <!-- 工單內容 -->
    <InfoCard title="工單內容">
      <p class="description">{{ ticket.description }}</p>
      <KeyValue label="關聯事件">
        <RouterLink v-if="ticket.relatedEventId" :to="`/op2/${ticket.relatedEventId}`" class="id-link">
          {{ ticket.relatedEventId }} →
        </RouterLink>
        <span v-else class="none-text">無</span>
      </KeyValue>
      <KeyValue label="關聯情報員">
        <RouterLink v-if="ticket.relatedInformantId" :to="`/op4/${ticket.relatedInformantId}`" class="id-link">
          {{ ticket.relatedInformantId }} →
        </RouterLink>
        <span v-else class="none-text">無</span>
      </KeyValue>
      <KeyValue label="提交時間" :value="ticket.submittedAt" mono />
    </InfoCard>

    <!-- 回覆輸入（processing 才顯示） -->
    <InfoCard v-if="ticket.status === 'processing'" title="新增回覆（內部留跡）">
      <textarea
        v-model="replyText"
        class="reply-textarea"
        rows="3"
        placeholder="輸入內部回覆或處理備註…"
      ></textarea>
      <div class="reply-actions">
        <button
          class="reply-btn"
          :disabled="!replyText.trim()"
          @click="submitReply"
        >送出回覆</button>
      </div>
    </InfoCard>

    <!-- 動作列 -->
    <ActionBar v-if="!isTerminated">
      <template v-if="ticket.status === 'pending'">
        <button class="btn primary" @click="handleAccept">受理</button>
        <button class="btn danger"  @click="openDialog('reject')">退單</button>
      </template>
      <template v-else-if="ticket.status === 'processing'">
        <button class="btn primary" @click="openDialog('close')">結案</button>
      </template>
    </ActionBar>

    <!-- 工單歷程 -->
    <StatusTimeline title="工單歷程" :entries="timelineEntries" />

    <!-- 確認對話框 -->
    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      :reasons="dialog.reasons"
      @confirm="onConfirm"
      @cancel="dialog.open = false"
    />
  </main>

  <main class="detail empty" v-else>
    <p>請從左側選擇一筆工單</p>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs }   from 'pinia'
import { useTicketsStore } from '../../stores/tickets'
import { useToastStore }   from '../../stores/toast'
import StatusBadge    from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store = useTicketsStore()
const toast = useToastStore()
const { selectedTicket: ticket } = storeToRefs(store)

const replyText = ref('')

const STATUS_LABELS   = { pending: '待處理', processing: '處理中', closed: '已結案', rejected: '已退單' }
const STATUS_VARIANTS = { pending: 'wait',   processing: 'info',   closed: 'ok',     rejected: 'danger' }

const TYPE_CHIP = {
  '積分爭議': 'chip-warn',
  '帳號問題': 'chip-danger',
  '任務糾紛': 'chip-accent',
  '系統反饋': 'chip-info',
  '其他':     '',
}

const REJECT_REASONS = [
  { value: '資料不足',   label: '資料不足' },
  { value: '重複工單',   label: '重複工單' },
  { value: '非服務範圍', label: '非服務範圍' },
  { value: 'other',      label: '其他' },
]
const CLOSE_REASONS = [
  { value: '問題已解決', label: '問題已解決' },
  { value: '用戶確認',   label: '用戶確認' },
  { value: '無法復現',   label: '無法復現' },
  { value: 'other',      label: '其他' },
]

const isTerminated = computed(() =>
  ['closed', 'rejected'].includes(ticket.value?.status)
)

const steps = computed(() => {
  const s = ticket.value?.status ?? 'pending'
  if (s === 'rejected') {
    return [
      { label: '建立', state: 'done', lockAfter: false },
      { label: '退單', state: 'now',  lockAfter: false },
    ]
  }
  const isDone = s === 'closed'
  const isProc = s === 'processing' || isDone
  return [
    { label: '建立',  state: 'done',                                          lockAfter: false },
    { label: '受理',  state: isProc ? 'done' : 'now',                        lockAfter: false },
    { label: '處理中', state: isProc ? (isDone ? 'done' : 'now') : 'pending', lockAfter: false },
    { label: '結案',  state: isDone ? 'now' : 'pending',                     lockAfter: false },
  ]
})

const timelineEntries = computed(() =>
  (ticket.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1 || isTerminated.value,
  }))
)

const dialog = ref({ open: false, action: '', title: '', body: '', reasons: [] })

const DIALOG_CONFIG = {
  reject: {
    title:   '確認退單？',
    body:    (t) => `工單 ${t.id}（${t.type}）將被退回，請選擇退單依據。`,
    reasons: REJECT_REASONS,
  },
  close: {
    title:   '確認結案？',
    body:    (t) => `工單 ${t.id}（${t.type}）將標記結案，請選擇結案依據。`,
    reasons: CLOSE_REASONS,
  },
}

function handleAccept() {
  store.applyAction(ticket.value.id, 'accept', '')
  toast.success('已受理工單・已留跡')
}

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open:    true,
    action,
    title:   cfg.title,
    body:    cfg.body(ticket.value),
    reasons: cfg.reasons,
  }
}

function onConfirm(reason) {
  const action = dialog.value.action
  store.applyAction(ticket.value.id, action, reason)
  dialog.value.open = false
  toast.success(action === 'close' ? '已結案・已留跡' : '已退單・已留跡')
}

function submitReply() {
  if (!replyText.value.trim()) return
  store.applyAction(ticket.value.id, 'reply', replyText.value.trim())
  toast.success('已新增回覆・已留跡')
  replyText.value = ''
}
</script>

<style scoped>
.detail {
  overflow-y: auto;
  padding: 24px 28px;
  display: grid;
  gap: 20px;
  align-content: start;
}
.detail.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

/* 頁頭 */
.d-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.d-head h2 { font-size: 22px; font-family: var(--mono); }

.type-chip {
  font-size: 12px;
  border-radius: 999px;
  padding: 3px 12px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
  white-space: nowrap;
}
.type-chip.chip-warn    { color: var(--warn);   border-color: var(--warn);   background: rgba(229,184,75,.08); }
.type-chip.chip-danger  { color: var(--danger); border-color: var(--danger); background: rgba(229,96,76,.08); }
.type-chip.chip-accent  { color: var(--accent); border-color: var(--accent); background: rgba(76,154,255,.08); }
.type-chip.chip-info    { color: var(--info);   border-color: var(--info);   background: rgba(88,193,212,.08); }

.terminated-note {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px dashed var(--line);
  border-radius: 999px;
  padding: 3px 14px;
}

/* 工單內容 */
.description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
}
.id-link {
  color: var(--accent);
  text-decoration: none;
  font-family: var(--mono);
  font-size: 14px;
}
.id-link:hover { text-decoration: underline; }
.none-text { font-size: 14px; color: var(--text-secondary); }

/* 回覆輸入 */
.reply-textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 10px 12px;
  resize: vertical;
  line-height: 1.6;
}
.reply-textarea:focus { outline: 1px solid var(--accent); }
.reply-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.reply-btn {
  background: none;
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: var(--accent);
  font-size: 13px;
  font-family: var(--sans);
  padding: 6px 18px;
  cursor: pointer;
  transition: background .12s;
}
.reply-btn:hover:not(:disabled) { background: rgba(76,154,255,.1); }
.reply-btn:disabled { opacity: .4; cursor: not-allowed; }

/* 動作按鈕 */
.btn {
  border-radius: 8px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 11px 22px;
  font-size: 15px;
  cursor: pointer;
  font-family: var(--sans);
  transition: background .12s;
}
.btn:hover { background: var(--bg-panel-raised); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.1); }
.btn.danger  { color: var(--danger); border-color: var(--danger); }
.btn.danger:hover { background: rgba(229, 96, 76, .08); }
</style>
