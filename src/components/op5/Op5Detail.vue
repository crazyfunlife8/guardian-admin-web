<template>
  <main class="detail" v-if="appeal">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ appeal.id }}</h2>
      <StatusBadge :label="STATUS_LABELS[appeal.status]" :variant="STATUS_VARIANTS[appeal.status]" />
      <span v-if="isTerminated" class="terminated-note">此申訴已結案，不可再操作</span>
    </div>

    <!-- 狀態機流轉條 -->
    <StateMachineBar :steps="steps" />

    <!-- 申訴內容 -->
    <InfoCard title="申訴內容">
      <div class="type-row">
        <span class="type-chip">{{ appeal.type }}</span>
      </div>
      <p class="description">{{ appeal.description }}</p>
    </InfoCard>

    <!-- 關聯資訊 -->
    <InfoCard title="關聯資訊">
      <KeyValue label="申訴人">
        <RouterLink :to="`/op4/${appeal.informantId}`" class="id-link">
          {{ appeal.informantId }} →
        </RouterLink>
      </KeyValue>
      <KeyValue label="關聯事件">
        <RouterLink v-if="appeal.relatedEventId" :to="`/op2/${appeal.relatedEventId}`" class="id-link">
          {{ appeal.relatedEventId }} →
        </RouterLink>
        <span v-else class="none-text">無關聯事件</span>
      </KeyValue>
      <KeyValue label="提交時間" :value="appeal.submittedAt" mono />
    </InfoCard>

    <!-- 動作列 -->
    <ActionBar v-if="!isTerminated">
      <template v-if="appeal.status === 'pending'">
        <button class="btn primary" @click="openDialog('accept')">受理申訴</button>
      </template>
      <template v-else-if="appeal.status === 'investigating'">
        <button class="btn primary" @click="openDialog('uphold')">裁決成立</button>
        <button class="btn danger"  @click="openDialog('reject')">裁決不成立</button>
      </template>
    </ActionBar>

    <!-- 審理時間軸 -->
    <StatusTimeline
      title="審理歷程（每節點皆須留跡）"
      :entries="timelineEntries"
    />

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
    <p>請從左側選擇一筆申訴單</p>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs }   from 'pinia'
import { useAppealsStore } from '../../stores/appeals'
import { useToastStore }   from '../../stores/toast'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store = useAppealsStore()
const toast = useToastStore()
const { selectedAppeal: appeal } = storeToRefs(store)

const STATUS_LABELS = {
  pending:       '待處理',
  investigating: '處理中',
  upheld:        '成立',
  rejected:      '不成立',
}
const STATUS_VARIANTS = {
  pending:       'wait',
  investigating: 'info',
  upheld:        'ok',
  rejected:      'danger',
}

const VERDICT_REASONS = [
  { value: 'verified',  label: '調查核實' },
  { value: 'rule',      label: '規則判定' },
  { value: 'evidence',  label: '多方佐證' },
  { value: 'other',     label: '其他' },
]

const DEFAULT_REASONS = [
  { value: 'internal',   label: '內部查核' },
  { value: 'feedback',   label: '多方反饋' },
  { value: 'correction', label: '來源更正' },
  { value: 'other',      label: '其他' },
]

const isTerminated = computed(() => ['upheld', 'rejected'].includes(appeal.value?.status))

const steps = computed(() => {
  const s = appeal.value?.status ?? 'pending'
  const isClosed = isTerminated.value
  const isInv    = s === 'investigating' || isClosed
  const result   = appeal.value?.result
  return [
    { label: '提交', state: 'done',                              lockAfter: false },
    { label: '受理', state: isInv ? 'done' : 'now',             lockAfter: false },
    { label: '調查', state: isClosed ? 'done' : (isInv ? 'now' : 'pending'), lockAfter: false },
    {
      label: isClosed ? (result === 'upheld' ? '成立' : '不成立') : '裁決',
      state: isClosed ? 'now' : 'pending',
      lockAfter: false,
    },
  ]
})

const timelineEntries = computed(() =>
  (appeal.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1 || isTerminated.value,
  }))
)

const DIALOG_CONFIG = {
  accept: {
    title:   '確認受理此申訴？',
    body:    (a) => `將 ${a.id}（${a.type}）標記為受理，進入調查流程。`,
    reasons: DEFAULT_REASONS,
  },
  uphold: {
    title:   '確認裁決成立？',
    body:    (a) => `申訴人 ${a.informantId} 的「${a.type}」申訴將判定成立，請選擇裁決依據。`,
    reasons: VERDICT_REASONS,
  },
  reject: {
    title:   '確認裁決不成立？',
    body:    (a) => `申訴人 ${a.informantId} 的「${a.type}」申訴將判定不成立，請選擇裁決依據。`,
    reasons: VERDICT_REASONS,
  },
}

const dialog = ref({ open: false, action: '', title: '', body: '', reasons: DEFAULT_REASONS })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open:    true,
    action,
    title:   cfg.title,
    body:    cfg.body(appeal.value),
    reasons: cfg.reasons,
  }
}

function onConfirm(reason) {
  store.applyAction(appeal.value.id, dialog.value.action, reason)
  dialog.value.open = false
  toast.success('已處理・已留跡')
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

.d-head { display: flex; align-items: center; gap: 14px; }
.d-head h2 { font-size: 22px; font-family: var(--mono); }
.terminated-note {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px dashed var(--line);
  border-radius: 999px;
  padding: 3px 14px;
}

/* 申訴內容 */
.type-row { margin-bottom: 8px; }
.type-chip {
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(76, 154, 255, .1);
  color: var(--accent);
  border: 1px solid var(--accent);
}
.description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

/* 關聯資訊 */
.id-link {
  color: var(--accent);
  text-decoration: none;
  font-family: var(--mono);
  font-size: 14px;
}
.id-link:hover { text-decoration: underline; }
.none-text { font-size: 14px; color: var(--text-secondary); }

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
}
.btn:hover { background: var(--bg-panel-raised); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.1); }
.btn.danger  { color: var(--danger); border-color: var(--danger); }
.btn.danger:hover { background: rgba(229, 96, 76, .08); }
</style>
