<template>
  <main class="detail" v-if="app">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ app.id }}</h2>
      <StatusBadge :label="STATUS_LABELS[app.status]" :variant="STATUS_VARIANTS[app.status]" />
      <span v-if="isTerminated" class="terminated-note">{{ terminatedNote }}</span>
    </div>

    <!-- 狀態機流轉條 -->
    <StateMachineBar :steps="steps" />

    <!-- 申請人資料 -->
    <InfoCard title="申請人資料">
      <KeyValue label="姓名"     :value="app.name" />
      <KeyValue label="手機末碼" :value="`**** ${app.phoneSuffix}`" mono />
      <KeyValue label="車牌末碼" :value="`*** ${app.plateSuffix}`"  mono />
      <KeyValue label="服務區域" :value="app.zone" />
      <KeyValue label="提交時間" :value="app.submittedAt" mono />
    </InfoCard>

    <!-- 動作列（僅 pending 顯示） -->
    <ActionBar v-if="app.status === 'pending'">
      <button class="btn primary" @click="openDialog('approve')">審核通過</button>
      <button class="btn danger"  @click="openDialog('reject')">拒絕申請</button>
    </ActionBar>

    <!-- 審核歷程 -->
    <StatusTimeline
      title="審核歷程（每筆動作皆自動留跡）"
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
    <p>請從左側選擇一筆申請</p>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs }   from 'pinia'
import { useRouter }     from 'vue-router'
import { useReviewStore } from '../../stores/review'
import { useToastStore }  from '../../stores/toast'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const router = useRouter()
const store  = useReviewStore()
const toast  = useToastStore()
const { selectedApp: app } = storeToRefs(store)

const STATUS_LABELS   = { pending: '待審核', approved_pending: '已核准待綁定', active: '已開通', rejected: '已拒絕' }
const STATUS_VARIANTS = { pending: 'wait',   approved_pending: 'info',          active: 'ok',      rejected: 'danger' }

const REJECT_REASONS = [
  { value: 'mismatch', label: '資料不符' },
  { value: 'photo',    label: '照片不清晰' },
  { value: 'zone',     label: '服務區域未開放' },
  { value: 'other',    label: '其他' },
]

const DEFAULT_REASONS = [
  { value: 'internal',   label: '內部查核' },
  { value: 'feedback',   label: '多方反饋' },
  { value: 'correction', label: '來源更正' },
  { value: 'other',      label: '其他' },
]

const isTerminated = computed(() => app.value?.status !== 'pending')

const terminatedNote = computed(() => {
  switch (app.value?.status) {
    case 'approved_pending': return '已核准・等待申請人完成四項必綁'
    case 'active':           return '已開通・申請流程已完結'
    case 'rejected':         return '已拒絕・此申請已終結'
    default:                 return null
  }
})

const steps = computed(() => {
  const s = app.value?.status ?? 'pending'
  if (s === 'rejected') {
    return [
      { label: '提交申請', state: 'done' },
      { label: '審核中',   state: 'done' },
      { label: '已拒絕',   state: 'now'  },
    ]
  }
  return [
    { label: '提交申請',     state: 'done' },
    { label: '審核中',       state: s === 'pending'          ? 'now'    : 'done'    },
    { label: '已核准待綁定', state: s === 'approved_pending' ? 'now'    : s === 'active' ? 'done' : 'pending' },
    { label: '已開通',       state: s === 'active'           ? 'now'    : 'pending' },
  ]
})

const timelineEntries = computed(() =>
  (app.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1 || isTerminated.value,
  }))
)

const DIALOG_CONFIG = {
  approve: {
    title:   '確認審核通過？',
    body:    (a) => `將 ${a.id}（${a.name}）的資格申請核准。申請人將收到通知，完成四項必綁後系統自動開通。`,
    reasons: DEFAULT_REASONS,
  },
  reject: {
    title:   '確認拒絕申請？',
    body:    (a) => `將 ${a.id}（${a.name}）的申請拒絕，請選擇拒絕原因。`,
    reasons: REJECT_REASONS,
  },
}

const dialog = ref({ open: false, action: '', title: '', body: '', reasons: DEFAULT_REASONS })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open:    true,
    action,
    title:   cfg.title,
    body:    cfg.body(app.value),
    reasons: cfg.reasons,
  }
}

function onConfirm(reason) {
  store.applyReviewAction(app.value.id, dialog.value.action, reason)
  dialog.value.open = false
  toast.success('已處理・已留跡')
  if (dialog.value.action === 'approve') {
    router.push('/op4')
  }
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

.d-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.d-head h2 {
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
