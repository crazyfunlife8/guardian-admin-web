<template>
  <main class="detail" v-if="acase">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ acase.id }}</h2>
      <StatusBadge :label="STATUS_LABELS[acase.status]" :variant="STATUS_VARIANTS[acase.status]" />
      <span v-if="isTerminated" class="terminated-note">已結案，不可再操作</span>
    </div>

    <!-- 狀態機流轉條 -->
    <StateMachineBar :steps="steps" />

    <!-- 觸發說明 -->
    <InfoCard title="觸發說明">
      <KeyValue label="觸發規則">
        <span class="rule-text">{{ acase.rule }}</span>
      </KeyValue>
      <KeyValue v-if="acase.informantId" label="情報員">
        <RouterLink :to="`/op4/${acase.informantId}`" class="id-link">
          {{ acase.informantId }} →
        </RouterLink>
      </KeyValue>
      <KeyValue v-if="acase.sourceId" label="來源識別">
        <span class="mono">{{ acase.sourceId }}</span>
      </KeyValue>
      <KeyValue label="觸發時間" :value="acase.triggeredAt" mono />
    </InfoCard>

    <!-- 任務佐證 -->
    <InfoCard v-if="acase.taskId" title="任務佐證">
      <p v-if="acase.evidenceSkipped" class="ev-note">情報員跳過佐證上傳（此任務不計酬）</p>
      <template v-else-if="acase.evidence.length">
        <div v-for="ev in acase.evidence" :key="ev.id" class="ev-row">
          <span class="ev-type mono">{{ ev.evidenceType }}</span>
          <span class="ev-time">{{ ev.createdAt }}</span>
          <button class="btn-ev" @click="viewEvidence(ev.id)">查看</button>
        </div>
        <div v-if="evBlobUrl" class="ev-preview">
          <img v-if="evIsImage" :src="evBlobUrl" alt="佐證" />
          <a v-else :href="evBlobUrl" target="_blank" class="ev-dl">下載影片檔</a>
        </div>
        <p v-if="evError" class="ev-note danger">{{ evError }}</p>
      </template>
      <p v-else class="ev-note">尚無佐證記錄</p>
    </InfoCard>

    <!-- 動作列 -->
    <ActionBar v-if="!isTerminated">
      <button class="btn primary" @click="openDialog('confirm')">確認停權</button>
      <button class="btn neutral" @click="openDialog('clear')">誤判解除</button>
    </ActionBar>

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
    <p>請從左側選擇一筆案件</p>
  </main>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs }      from 'pinia'
import { useAbuseCheckStore } from '../../stores/abuseCheck'
import { useToastStore }    from '../../stores/toast'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store = useAbuseCheckStore()
const toast = useToastStore()
const { selectedCase: acase } = storeToRefs(store)

const evBlobUrl  = ref(null)
const evIsImage  = ref(true)
const evError    = ref('')

function revokeEv() {
  if (evBlobUrl.value) {
    URL.revokeObjectURL(evBlobUrl.value)
    evBlobUrl.value = null
  }
}

watch(() => acase.value?.id, () => {
  revokeEv()
  evError.value = ''
})

onUnmounted(revokeEv)

async function viewEvidence(evidenceId) {
  revokeEv()
  evError.value = ''
  try {
    const { url, isImage } = await store.fetchEvidenceFile(acase.value.taskId, evidenceId)
    evBlobUrl.value = url
    evIsImage.value = isImage
  } catch (e) {
    evError.value = e.message === '404' ? '檔案不存在（已從 Storage 移除）' : '載入失敗，請稍後再試'
  }
}

const STATUS_LABELS = {
  pending:   '待覆核',
  confirmed: '確認停權',
  cleared:   '誤判解除',
}
const STATUS_VARIANTS = {
  pending:   'wait',
  confirmed: 'danger',
  cleared:   'ok',
}

const CONFIRM_REASONS = [
  { value: 'verified',  label: '確認違規' },
  { value: 'evidence',  label: '多方佐證' },
  { value: 'rule',      label: '規則命中' },
  { value: 'other',     label: '其他' },
]
const CLEAR_REASONS = [
  { value: 'verified',   label: '調查核實（誤判）' },
  { value: 'evidence',   label: '多方佐證（無異常）' },
  { value: 'new_member', label: '新成員正常波動' },
  { value: 'other',      label: '其他' },
]

const isTerminated = computed(() =>
  ['confirmed', 'cleared'].includes(acase.value?.status)
)

const steps = computed(() => {
  const s = acase.value?.status ?? 'pending'
  const isClosed = isTerminated.value
  return [
    { label: '系統觸發', state: 'done',                      lockAfter: false },
    { label: '覆核中',   state: isClosed ? 'done' : 'now',   lockAfter: false },
    {
      label: isClosed ? (s === 'confirmed' ? '確認停權' : '誤判解除') : '裁決',
      state: isClosed ? 'now' : 'pending',
      lockAfter: false,
    },
  ]
})

const DIALOG_CONFIG = {
  confirm: {
    title:   '確認對此案件執行停權？',
    body:    (c) => `案件 <b style="font-family:var(--mono)">${c.id}</b> 將標記為確認違規，相關情報員或來源將被執行停權。`,
    reasons: CONFIRM_REASONS,
  },
  clear: {
    title:   '確認誤判解除？',
    body:    (c) => `案件 <b style="font-family:var(--mono)">${c.id}</b> 將標記為誤判解除，警示撤銷且不執行任何處置。`,
    reasons: CLEAR_REASONS,
  },
}

const dialog = ref({ open: false, action: '', title: '', body: '', reasons: CONFIRM_REASONS })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open:    true,
    action,
    title:   cfg.title,
    body:    cfg.body(acase.value),
    reasons: cfg.reasons,
  }
}

function onConfirm(reason) {
  store.applyCaseAction(acase.value.id, dialog.value.action, reason)
  dialog.value.open = false
  toast.success(dialog.value.action === 'confirm' ? '已確認停權・已留跡' : '已誤判解除・已留跡')
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

.rule-text  { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
.id-link    { color: var(--accent); text-decoration: none; font-family: var(--mono); font-size: 14px; }
.id-link:hover { text-decoration: underline; }
.mono { font-family: var(--mono); }

.ev-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.ev-row:last-of-type { border-bottom: none; }
.ev-type { color: var(--text-primary); min-width: 60px; }
.ev-time { color: var(--text-secondary); flex: 1; }

.btn-ev {
  font-size: 12px;
  color: var(--accent);
  background: none;
  border: 1px dashed var(--accent);
  border-radius: 6px;
  padding: 3px 10px;
  cursor: pointer;
  font-family: var(--sans);
}
.btn-ev:hover { background: rgba(88,193,212,.08); }

.ev-preview { margin-top: 12px; }
.ev-preview img { max-width: 100%; border-radius: 8px; border: 1px solid var(--line); }
.ev-dl { color: var(--accent); font-size: 13px; text-decoration: none; }
.ev-dl:hover { text-decoration: underline; }

.ev-note { font-size: 13px; color: var(--text-secondary); }
.ev-note.danger { color: var(--danger); }

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
.btn:hover  { background: var(--bg-panel-raised); }
.btn.primary { background: var(--danger); border-color: var(--danger); color: #fff; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.1); }
.btn.neutral { color: var(--text-secondary); }
.btn.neutral:hover { color: var(--text-primary); }
</style>
