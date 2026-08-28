<template>
  <main class="detail" v-if="app">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ app.id }}</h2>
      <StatusBadge :label="STATUS_LABELS[app.state]" :variant="STATUS_VARIANTS[app.state]" />
      <span v-if="isTerminated" class="terminated-note">{{ terminatedNote }}</span>
    </div>

    <!-- 狀態機流轉條 -->
    <StateMachineBar :steps="steps" />

    <!-- 申請人資料（個資欄位來自 ApplicationDetail，需點選才載入） -->
    <InfoCard title="申請人資料">
      <KeyValue label="姓名"     :value="app.name || bindingPlaceholder" />
      <KeyValue label="手機"     :value="app.phone || '－'" mono />
      <KeyValue label="身分證字號" :value="app.idNo || bindingPlaceholder" mono />
      <KeyValue label="收款帳戶" :value="app.payoutAccount || bindingPlaceholder" mono />
      <KeyValue label="電子郵件" :value="app.email || bindingPlaceholder" />
      <KeyValue label="職業類型" :value="app.qualLabel || app.qualType" />
      <KeyValue label="提交時間" :value="app.submittedAt" mono />
    </InfoCard>

    <!-- 職業佐證（管理員可查看，每次調閱會寫稽核紀錄） -->
    <InfoCard v-if="isAdmin" title="職業佐證">
      <template v-if="app.hasCertFile">
        <div v-if="certBlobUrl" class="cert-preview">
          <img :src="certBlobUrl" alt="職業佐證" />
        </div>
        <p v-else-if="certError" class="cert-note danger">{{ certError }}</p>
        <button v-else class="btn-cert" :disabled="certLoading" @click="loadCertFile">
          {{ certLoading ? '載入中…' : '查看職業佐證（每次調閱均留稽核跡）' }}
        </button>
      </template>
      <p v-else class="cert-note">申請人尚未上傳佐證檔案</p>
    </InfoCard>

    <!-- 動作列（僅 Pending 顯示） -->
    <ActionBar v-if="app.state === 'pending'">
      <button class="btn primary" @click="openDialog('approve')">審核通過</button>
      <button class="btn danger"  @click="openDialog('reject')">拒絕申請</button>
    </ActionBar>

    <StatusTimeline title="審核歷程（每筆動作皆自動留跡）" :entries="timelineEntries" />

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
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs }   from 'pinia'
import { useReviewStore } from '../../stores/review'
import { useToastStore }  from '../../stores/toast'
import { useAuthStore }   from '../../stores/auth'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store     = useReviewStore()
const toast     = useToastStore()
const authStore = useAuthStore()
const { selectedApp: app } = storeToRefs(store)

const isAdmin = computed(() => authStore.user?.role === 'Admin')

const certBlobUrl = ref(null)
const certLoading = ref(false)
const certError   = ref('')

function revokeCert() {
  if (certBlobUrl.value) {
    URL.revokeObjectURL(certBlobUrl.value)
    certBlobUrl.value = null
  }
}

watch(() => app.value?.id, () => {
  revokeCert()
  certError.value = ''
})

onUnmounted(revokeCert)

async function loadCertFile() {
  certLoading.value = true
  certError.value   = ''
  try {
    certBlobUrl.value = await store.fetchCertFile(app.value.id)
  } catch (e) {
    certError.value = e.message === '404' ? '檔案不存在（已從 Storage 移除）' : '載入失敗，請稍後再試'
  } finally {
    certLoading.value = false
  }
}

const bindingPlaceholder = computed(() =>
  ['pending', 'approved_pending'].includes(app.value?.state) ? '待申請人完成綁定' : '－'
)

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

const isTerminated = computed(() => app.value?.state !== 'pending')

const terminatedNote = computed(() => {
  switch (app.value?.state) {
    case 'approved_pending': return '已核准・等待申請人完成四項必綁'
    case 'active':   return '已開通・申請流程已完結'
    case 'rejected': return '已拒絕・此申請已終結'
    default:         return null
  }
})

const steps = computed(() => {
  const s = app.value?.state ?? 'pending'
  if (s === 'rejected') {
    return [
      { label: '提交申請', state: 'done' },
      { label: '審核中',   state: 'done' },
      { label: '已拒絕',   state: 'now'  },
    ]
  }
  return [
    { label: '提交申請',     state: 'done' },
    { label: '審核中',       state: s === 'pending'   ? 'now' : 'done'    },
    { label: '已核准待綁定', state: s === 'approved_pending'  ? 'now' : s === 'active' ? 'done' : 'pending' },
    { label: '已開通',       state: s === 'active'    ? 'now' : 'pending' },
  ]
})

const timelineEntries = computed(() =>
  (app.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1,
  }))
)

const DIALOG_CONFIG = {
  approve: {
    title:   '確認審核通過？',
    body:    (a) => `將申請 ${a.id}（${a.qualLabel || a.qualType}）的資格申請核准。申請人將收到通知，完成四項必綁後系統自動開通。`,
    reasons: DEFAULT_REASONS,
  },
  reject: {
    title:   '確認拒絕申請？',
    body:    (a) => `將申請 ${a.id}（${a.qualLabel || a.qualType}）的申請拒絕，請選擇拒絕原因。`,
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

async function onConfirm(reason) {
  try {
    await store.applyReviewAction(app.value.id, dialog.value.action, reason)
    toast.success('已處理・已留跡')
  } catch (err) {
    toast.error(err?.response?.data?.message ?? '操作失敗，請重試')
  } finally {
    dialog.value.open = false
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

.btn-cert {
  font-size: 13px;
  color: var(--accent);
  background: none;
  border: 1px dashed var(--accent);
  border-radius: 7px;
  padding: 7px 14px;
  cursor: pointer;
  font-family: var(--sans);
  transition: background .12s;
}
.btn-cert:hover:not(:disabled) { background: rgba(88,193,212,.08); }
.btn-cert:disabled { opacity: .5; cursor: not-allowed; }

.cert-preview img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.cert-note {
  font-size: 13px;
  color: var(--text-secondary);
}
.cert-note.danger { color: var(--danger); }
</style>
