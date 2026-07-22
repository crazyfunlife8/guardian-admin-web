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

    <!-- 相關回報紀錄 -->
    <InfoCard title="相關回報紀錄">
      <div class="report-table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th>時間</th>
              <th>類型</th>
              <th>路段</th>
              <th>判定結果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in acase.reports" :key="r.time + r.location">
              <td class="mono">{{ r.time }}</td>
              <td>{{ r.type }}</td>
              <td>{{ r.location }}</td>
              <td :class="resultClass(r.result)">{{ r.result }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </InfoCard>

    <!-- 動作列 -->
    <ActionBar v-if="!isTerminated">
      <button class="btn primary" @click="openDialog('confirm')">確認停權</button>
      <button class="btn neutral" @click="openDialog('clear')">誤判解除</button>
    </ActionBar>

    <!-- 覆核時間軸 -->
    <StatusTimeline title="覆核歷程（每節點皆須留跡）" :entries="timelineEntries" />

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
import { ref, computed }    from 'vue'
import { storeToRefs }      from 'pinia'
import { useAbuseCheckStore } from '../../stores/abuseCheck'
import { useToastStore }    from '../../stores/toast'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store = useAbuseCheckStore()
const toast = useToastStore()
const { selectedCase: acase } = storeToRefs(store)

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

const timelineEntries = computed(() =>
  (acase.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1 || isTerminated.value,
  }))
)

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

function resultClass(result) {
  if (result === '系統誤報') return 'result-bad'
  if (result === '確認')     return 'result-ok'
  return 'result-neutral'
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

/* 相關回報表 */
.report-table-wrap { overflow-x: auto; }
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.report-table th {
  text-align: left;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 6px 12px 6px 0;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.report-table td {
  padding: 8px 12px 8px 0;
  border-bottom: 1px solid rgba(42,53,71,.3);
  color: var(--text-primary);
  vertical-align: middle;
}
.report-table tr:last-child td { border-bottom: none; }
.result-ok      { color: var(--ok); }
.result-bad     { color: var(--danger); }
.result-neutral { color: var(--text-secondary); }

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
