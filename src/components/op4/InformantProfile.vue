<template>
  <!-- 404 態 -->
  <div v-if="!inf" class="not-found">
    <p>找不到情報員 {{ informantId }}</p>
    <RouterLink to="/op4" class="back-link">← 返回搜尋</RouterLink>
  </div>

  <!-- 檔案態 -->
  <div v-else class="profile">
    <!-- 身分列 -->
    <div class="identity-bar">
      <span class="iid">{{ inf.id }}</span>
      <StatusBadge :label="STATUS_LABELS[inf.state]" :variant="STATUS_VARIANTS[inf.state]" />
      <span v-if="inf.state === 'suspended'" class="suspended-note">帳號停權中，不可接任務</span>
      <RouterLink to="/op4" class="back-search">← 返回搜尋</RouterLink>
    </div>

    <!-- 管理動作 -->
    <ActionBar v-if="canManage || inf.state === 'removed'">
      <template v-if="inf.state === 'Active'">
        <button class="btn warn" @click="openActionDialog('suspend')">停權</button>
        <button class="btn danger" @click="openActionDialog('remove')">除名</button>
      </template>
      <template v-else-if="inf.state === 'Suspended'">
        <button class="btn primary" @click="openActionDialog('reinstate')">恢復帳號</button>
        <button class="btn danger" @click="openActionDialog('remove')">除名</button>
      </template>
      <template v-else-if="inf.state === 'Removed'">
        <button class="btn danger" @click="openActionDialog('settle')">執行結清</button>
      </template>
    </ActionBar>

    <!-- 基本資料 -->
    <InfoCard title="基本資料">
      <KeyValue label="姓名">
        <template v-if="isAdmin">
          <MaskField ref="nameRef" :value="inf.name" :masked-text="inf.nameMasked || '●●●●'" @unmask="onUnmask('name')" />
        </template>
        <span v-else class="mono">{{ inf.nameMasked || '—' }}</span>
      </KeyValue>
      <KeyValue label="手機">
        <template v-if="isAdmin">
          <MaskField ref="phoneRef" :value="inf.phone" :masked-text="inf.phoneMasked || '●●●●'" @unmask="onUnmask('phone')" />
        </template>
        <span v-else class="mono">{{ inf.phoneMasked || '—' }}</span>
      </KeyValue>
      <KeyValue label="身分證字號">
        <template v-if="isAdmin">
          <MaskField ref="idRef" :value="inf.idNo" masked-text="●●●●●●●" @unmask="onUnmask('id')" />
        </template>
        <span v-else class="mono">●●●●●●●</span>
      </KeyValue>
      <KeyValue label="收款帳戶">
        <template v-if="isAdmin">
          <MaskField ref="bankRef" :value="inf.bankAccount" masked-text="●●●●●●●●" @unmask="onUnmask('bank')" />
        </template>
        <span v-else class="mono">●●●●●●●●</span>
      </KeyValue>
      <KeyValue label="加入日期" :value="inf.joinedAt || '—'" mono />
    </InfoCard>

    <!-- 審核歷程 -->
    <StatusTimeline
      title="審核歷程"
      :entries="reviewEntries"
    />

    <!-- 信譽紀錄 -->
    <InfoCard title="信譽紀錄">
      <div class="big-num-row">
        <div class="big-num">
          <span class="num" :class="{ 'score-low': inf.reputation.score !== null && inf.reputation.score < 60 }">
            {{ inf.reputation.score ?? '—' }}
          </span>
          <small>信譽分數</small>
        </div>
        <button v-if="canManage && !showRepForm" class="adj-toggle" @click="showRepForm = true">調整分數</button>
      </div>

      <!-- 信譽分調整表單 -->
      <div v-if="showRepForm" class="rep-form">
        <div class="rep-row">
          <label class="rep-label">調整值（正數加分 / 負數扣分）</label>
          <input
            v-model.number="repDelta"
            type="number"
            min="-99"
            max="99"
            class="rep-input mono"
            placeholder="±"
          />
          <span v-if="repDelta" class="rep-preview">
            → {{ Math.max(0, Math.min(100, (inf.reputation.score ?? 50) + repDelta)) }}
          </span>
        </div>
        <select v-model="repReason" class="rep-reason">
          <option value="">請選擇依據</option>
          <option value="申訴翻案">申訴翻案</option>
          <option value="任務補核">任務補核</option>
          <option value="誤扣補正">誤扣補正</option>
          <option value="違規確認">違規確認</option>
          <option value="其他">其他</option>
        </select>
        <div class="rep-actions">
          <button class="btn primary" :disabled="!repDelta || !repReason" @click="submitRepAdj">確認調整・留跡</button>
          <button class="btn" @click="cancelRepForm">取消</button>
        </div>
      </div>

      <KeyValue label="近 30 天正確率" :value="inf.reputation.accuracy30d !== null ? `${inf.reputation.accuracy30d}%` : '資料不足'" mono />
      <KeyValue label="誤報次數"       :value="`${inf.reputation.falseReports} 次`" mono />
    </InfoCard>

    <!-- 任務摘要 -->
    <InfoCard title="任務摘要（本月）">
      <template v-if="inf.taskSummary">
        <KeyValue label="接單數"   :value="`${inf.taskSummary.monthlyCount} 件`" mono />
        <KeyValue label="完成率"   :value="inf.taskSummary.completionRate ? `${inf.taskSummary.completionRate}%` : '—'" mono />
        <KeyValue label="棄單次數" :value="`${inf.taskSummary.abandonCount} 次`" mono />
        <KeyValue label="抽查結果" mono>
          <span v-if="inf.taskSummary.auditResult">
            通過 {{ inf.taskSummary.auditResult.accepted ?? 0 }}・未通過 {{ inf.taskSummary.auditResult.rejected ?? 0 }}・待審 {{ inf.taskSummary.auditResult.pending ?? 0 }}
          </span>
          <span v-else>無紀錄</span>
        </KeyValue>
      </template>
      <p v-else class="empty-note">無任務摘要資料</p>
    </InfoCard>

    <!-- 帳本摘要 -->
    <InfoCard title="帳本摘要">
      <div class="big-num-row">
        <div class="big-num">
          <span class="num accent">{{ inf.balance.available.toLocaleString() }}</span>
          <small>可兌換積分</small>
        </div>
        <button v-if="isAdmin && !showDebitForm" class="adj-toggle" @click="showDebitForm = true">人工追回</button>
      </div>

      <!-- 人工追回表單（限管理員） -->
      <div v-if="showDebitForm" class="rep-form">
        <div class="rep-row">
          <label class="rep-label">追回點數（正整數，只扣可用積分）</label>
          <input
            v-model.number="debitAmount"
            type="number"
            min="1"
            class="rep-input mono"
            placeholder="點數"
          />
          <span v-if="debitAmount > 0" class="rep-preview">
            → {{ Math.max(0, inf.balance.available - debitAmount).toLocaleString() }} 點
          </span>
        </div>
        <input
          v-model="debitReason"
          class="rep-reason"
          placeholder="追回原因（必填）"
        />
        <div class="rep-actions">
          <button class="btn danger" :disabled="!debitAmount || debitAmount < 1 || !debitReason" @click="submitDebit">確認追回・留跡</button>
          <button class="btn" @click="cancelDebitForm">取消</button>
        </div>
      </div>

      <KeyValue label="凍結中" :value="inf.balance.frozen.toLocaleString()" mono />
      <KeyValue label="遞延中" :value="inf.balance.deferred.toLocaleString()" mono />
      <RouterLink :to="`/op9?gid=${inf.id}`" class="ledger-link">→ 詳細帳本（OP-9）</RouterLink>
    </InfoCard>

    <!-- 申訴史 -->
    <InfoCard title="申訴史">
      <div v-if="inf.appealHistory.length" class="appeal-list">
        <div v-for="a in inf.appealHistory" :key="a.date" class="appeal-row">
          <span class="mono date">{{ a.date }}</span>
          <span class="reason">{{ a.reason }}</span>
          <StatusBadge :label="a.result" :variant="a.result === '成立' ? 'ok' : 'danger'" />
        </div>
      </div>
      <p v-else class="empty-note">無申訴紀錄</p>
    </InfoCard>

    <!-- 反濫用標記（系統自動產生，唯讀） -->
    <InfoCard title="反濫用標記">
      <div class="chip-list">
        <span v-if="inf.tags.system.length === 0" class="empty-note">無反濫用標記</span>
        <span v-for="t in inf.tags.system" :key="t" class="chip system">{{ t }}</span>
      </div>
    </InfoCard>

    <!-- 管理動作確認對話框 -->
    <ConfirmDialog
      :open="actionDialog.open"
      :title="actionDialog.title"
      :body="actionDialog.body"
      :reasons="actionDialog.reasons"
      @confirm="onActionConfirm"
      @cancel="actionDialog.open = false"
    />

    <!-- 解除遮罩確認對話框（純確認，不需選理由） -->
    <ConfirmDialog
      :open="unmaskDialog.open"
      :title="unmaskDialog.title"
      :body="unmaskDialog.body"
      :reasons="[]"
      @confirm="onUnmaskConfirm"
      @cancel="unmaskDialog.open = false"
    />

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInformantsStore } from '../../stores/informants'
import { useToastStore }      from '../../stores/toast'
import { useAuthStore }       from '../../stores/auth'
import StatusBadge    from '../shared/StatusBadge.vue'
import InfoCard       from '../shared/InfoCard.vue'
import KeyValue       from '../shared/KeyValue.vue'
import MaskField      from '../shared/MaskField.vue'
import ActionBar      from '../shared/ActionBar.vue'
import StatusTimeline from '../shared/StatusTimeline.vue'
import ConfirmDialog  from '../shared/ConfirmDialog.vue'
import Toast          from '../shared/Toast.vue'

const props = defineProps({
  informantId: { type: String, required: true },
})

const store     = useInformantsStore()
const toast     = useToastStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'Admin')

const inf = computed(() => store.getById(props.informantId))

onMounted(() => store.fetchProfile(props.informantId))

const STATUS_LABELS   = { Pending: '審核中', Approved: '待綁定', Active: '正常', Suspended: '停權', Removed: '除名待結清', Cleared: '已結清' }
const STATUS_VARIANTS = { Pending: 'wait',   Approved: 'wait',    Active: 'ok',    Suspended: 'danger',  Removed: 'danger',   Cleared: 'danger'  }

// 審核史 → StatusTimeline 格式
const reviewEntries = computed(() =>
  (inf.value?.reviewHistory ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1,
  }))
)

// 管理動作
const canManage = computed(() =>
  inf.value && !['Pending', 'Approved', 'Removed', 'Cleared'].includes(inf.value.state)
)

const SUSPEND_REASONS = [
  { value: '違規行為確認', label: '違規行為確認' },
  { value: '反濫用標記',   label: '反濫用系統標記' },
  { value: '舉報核實',     label: '多方舉報核實' },
  { value: 'other',        label: '其他' },
]
const REINSTATE_REASONS = [
  { value: '申訴翻案成立', label: '申訴翻案成立' },
  { value: '確認為誤判',   label: '確認為誤判' },
  { value: '問題已解決',   label: '問題已解決' },
  { value: 'other',        label: '其他' },
]
const REMOVE_REASONS = [
  { value: '嚴重違規', label: '嚴重違規' },
  { value: '反覆違規', label: '反覆違規' },
  { value: '欺詐行為', label: '欺詐行為' },
  { value: 'other',    label: '其他' },
]

const ACTION_CONFIG = {
  suspend:   { title: '確認停權？',    reasons: SUSPEND_REASONS },
  reinstate: { title: '確認恢復帳號？', reasons: REINSTATE_REASONS },
  remove:    { title: '確認除名？',    reasons: REMOVE_REASONS },
  settle:    { title: '確認執行結清？', reasons: [] },
}
const ACTION_BODY = {
  suspend:   (id) => `將 ${id} 帳號停權，停權後無法接任務。可依申訴結果恢復。`,
  reinstate: (id) => `將 ${id} 帳號恢復正常，恢復後可重新接任務。`,
  remove:    (id) => `將 ${id} 帳號除名，進入「待結清」狀態。此操作請謹慎確認。`,
  settle:    (id) => `確認對 ${id} 執行結清。結清後帳號永久關閉，剩餘積分將依規定處理。此操作不可撤銷。`,
}

const actionDialog  = ref({ open: false, action: '', title: '', body: '', reasons: [] })

function openActionDialog(action) {
  const cfg = ACTION_CONFIG[action]
  actionDialog.value = {
    open:    true,
    action,
    title:   cfg.title,
    body:    ACTION_BODY[action](props.informantId),
    reasons: cfg.reasons,
  }
}

async function onActionConfirm(reason) {
  const { action } = actionDialog.value
  try {
    if (action === 'suspend')   await store.suspend(props.informantId, reason)
    if (action === 'reinstate') await store.reinstate(props.informantId, reason)
    if (action === 'remove')    await store.remove(props.informantId, reason)
    if (action === 'settle')    await store.settle(props.informantId)
    toast.success('操作已完成・已留跡')
  } catch (err) {
    if (action === 'settle') {
      const code = err?.response?.data?.errorCode
      if (code === 'ExitGraceNotExpired') {
        const until = err?.response?.data?.graceUntil
        toast.error(`緩衝期尚未結束，最早可於 ${until ?? '緩衝期結束後'} 執行結清`)
      } else if (code === 'PendingRedemptionExists') {
        toast.error('有未結案的兌換單（含掛起中），請先至 OP-8 將其拒單後再執行結清')
      } else if (code === 'ResidualBalancePending') {
        toast.error('仍有未處置積分，請先發放或以人工追回（OP-4 扣除）後再執行結清')
      } else {
        toast.error(err?.response?.data?.message ?? '結清失敗，請稍後重試')
      }
    } else {
      toast.error(err?.response?.data?.message ?? '操作失敗，請重試')
    }
  } finally {
    actionDialog.value.open = false
  }
}

// 人工追回
const showDebitForm = ref(false)
const debitAmount   = ref(0)
const debitReason   = ref('')

async function submitDebit() {
  if (!debitAmount.value || debitAmount.value < 1 || !debitReason.value) return
  try {
    await store.debit(props.informantId, debitAmount.value, debitReason.value)
    toast.success(`已追回 ${debitAmount.value} 點・已留跡`)
    cancelDebitForm()
  } catch (err) {
    const code = err?.response?.data?.errorCode
    if (code === 'InsufficientBalance') {
      toast.error(`可用積分不足，最多可追回 ${inf.value?.balance?.available ?? 0} 點（可分次扣除）`)
    } else {
      toast.error(err?.response?.data?.message ?? '追回失敗，請重試')
    }
  }
}

function cancelDebitForm() {
  showDebitForm.value = false
  debitAmount.value   = 0
  debitReason.value   = ''
}

// 信譽分調整
const showRepForm = ref(false)
const repDelta    = ref(0)
const repReason   = ref('')

async function submitRepAdj() {
  if (!repDelta.value || !repReason.value) return
  try {
    await store.adjustReputation(props.informantId, repDelta.value, repReason.value)
    toast.success(`信譽分已調整 ${repDelta.value > 0 ? '+' : ''}${repDelta.value}・已留跡`)
    cancelRepForm()
  } catch (err) {
    toast.error(err?.response?.data?.message ?? '調整失敗，請重試')
  }
}

function cancelRepForm() {
  showRepForm.value = false
  repDelta.value    = 0
  repReason.value   = ''
}

// 遮罩
const nameRef        = ref(null)
const phoneRef       = ref(null)
const idRef          = ref(null)
const bankRef        = ref(null)
const pendingUnmask  = ref(null)
const unmaskDialog   = ref({ open: false, title: '', body: '' })

function onUnmask(field) {
  pendingUnmask.value = field
  unmaskDialog.value = {
    open:  true,
    title: '確認解除遮罩？',
    body:  '此操作將記錄於稽核日誌。',
  }
}

async function onUnmaskConfirm() {
  try {
    await store.fetchUnmasked(props.informantId)
  } catch {}
  if (pendingUnmask.value === 'name')  nameRef.value?.reveal()
  if (pendingUnmask.value === 'phone') phoneRef.value?.reveal()
  if (pendingUnmask.value === 'id')    idRef.value?.reveal()
  if (pendingUnmask.value === 'bank')  bankRef.value?.reveal()
  pendingUnmask.value  = null
  unmaskDialog.value.open = false
  toast.success('已解除遮罩・已留跡')
}

</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--text-secondary);
}
.back-link { color: var(--accent); text-decoration: none; font-size: 14px; }

.profile {
  overflow-y: auto;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

/* 身分列 */
.identity-bar {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.iid {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 600;
}
.suspended-note {
  font-size: 13px;
  color: var(--danger);
  border: 1px dashed var(--danger);
  border-radius: 999px;
  padding: 3px 14px;
}
.back-search {
  margin-left: auto;
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
}
.back-search:hover { text-decoration: underline; }

/* 管理動作按鈕 */
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
.btn:hover   { background: var(--bg-panel-raised); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.1); }
.btn.warn   { color: var(--warn);   border-color: var(--warn); }
.btn.warn:hover { background: rgba(229,184,75,.08); }
.btn.danger { color: var(--danger); border-color: var(--danger); }
.btn.danger:hover { background: rgba(229,96,76,.08); }

/* 大數字 */
.big-num-row { margin-bottom: 4px; }
.big-num { display: flex; align-items: baseline; gap: 8px; }
.num {
  font-family: var(--mono);
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}
.num.accent   { color: var(--accent); }
.num.score-low { color: var(--danger); }
.big-num small { color: var(--text-secondary); font-size: 13px; }

/* 調整分數 */
.adj-toggle {
  margin-left: auto;
  font-size: 12px;
  border: 1px dashed var(--line);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  padding: 3px 10px;
  cursor: pointer;
  font-family: var(--sans);
  transition: color .12s, border-color .12s;
}
.adj-toggle:hover { color: var(--accent); border-color: var(--accent); }

.rep-form { display: grid; gap: 8px; margin: 10px 0 6px; }
.rep-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rep-label { font-size: 12px; color: var(--text-secondary); }
.rep-input {
  width: 80px;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 14px;
  padding: 5px 8px;
  text-align: center;
}
.rep-input:focus { outline: 1px solid var(--accent); border-color: var(--accent); }
.rep-preview { font-size: 13px; color: var(--accent); font-family: var(--mono); }
.rep-reason {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 6px 10px;
}
.rep-reason:focus { outline: 1px solid var(--accent); }
.rep-actions { display: flex; gap: 8px; }
.rep-actions .btn { font-size: 13px; padding: 7px 16px; }
.rep-actions .btn:disabled { opacity: .4; cursor: not-allowed; }

/* 帳本連結 */
.ledger-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
}
.ledger-link:hover { text-decoration: underline; }

/* 申訴史 */
.appeal-list { display: grid; gap: 10px; }
.appeal-row  { display: flex; align-items: center; gap: 14px; font-size: 14px; }
.date   { color: var(--text-secondary); min-width: 100px; }
.reason { flex: 1; }

/* 反濫用標記 */
.chip-list { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}
.chip.system { background: rgba(88, 193, 212, .12); color: var(--info); border: 1px solid var(--info); }

.empty-note { font-size: 13px; color: var(--text-secondary); }
</style>
