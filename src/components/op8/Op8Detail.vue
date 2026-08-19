<template>
  <main class="detail" v-if="order">
    <!-- 頁頭 -->
    <div class="d-head">
      <h2>{{ order.id }}</h2>
      <StatusBadge class="op-8-badge" :label="STATE_LABELS[order.status]" :variant="STATE_VARIANTS[order.status]" />
      <RouterLink v-if="order.informantId" :to="`/op4/${order.informantId}`" class="open-profile">開啟情報員檔案 #{{ order.informantId }} →</RouterLink>
    </div>

    <!-- 狀態機流轉條 -->
    <StateMachineBar :steps="steps" :suspended="order.status === 'Held'" />

    <!-- 資訊卡雙欄 -->
    <div class="cards">
      <InfoCard title="申請內容">
        <KeyValue label="申請來源" :value="order.source" />
        <KeyValue label="兌換項目" :value="order.items || '（詳見明細）'" />
        <KeyValue label="申請積分" :value="`${(order.amountPoints ?? 0).toLocaleString()} 積分`" />
        <KeyValue label="申請時間" :value="order.createdAt" />
        <!-- TODO(後端): 單筆上限驗算、本人否認標記尚未納入 RedemptionResponse -->
      </InfoCard>

      <InfoCard title="情報員積分餘額（即時）" class="balance-card">
        <!-- TODO(後端): 餘額資料需另呼叫 GET /api/backend/informants/{id}/profile 才能取得 -->
        <p class="todo-note">餘額資料待後端於 RedemptionResponse 補充，或由前端另行呼叫情報員 profile 端點</p>
        <KeyValue label="情報員 ID" :value="order.informantId ? `#${order.informantId}` : '—'" />
        <KeyValue label="核銷憑證" :value="order.voucherInfo || '（尚未填入）'" />
      </InfoCard>
    </div>

    <!-- 動作列（依狀態切換） -->
    <ActionBar>
      <template v-if="order.status === 'PendingReview' || order.status === 'Applied'">
        <button class="btn primary" @click="openDialog('confirm')">核對成立（凍結 {{ (order.amountPoints ?? 0).toLocaleString() }} 積分）</button>
        <button class="btn danger"  @click="openDialog('reject')">拒單</button>
      </template>
      <template v-else-if="order.status === 'Reserved'">
        <button class="btn primary" @click="openDialog('fillVoucher')">回填發放憑證</button>
        <button class="btn danger"  @click="openDialog('failBack')">發放失敗 / 取消（解凍）</button>
      </template>
      <template v-else-if="order.status === 'Disbursed'">
        <button class="btn primary" @click="openDialog('deduct')">扣除確認</button>
      </template>
    </ActionBar>

    <!-- 時間軸 -->
    <StatusTimeline
      title="單據歷程（每個狀態轉換當下留跡、不可事後補記）"
      :entries="order.history"
    />

    <!-- 確認對話框 -->
    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      @confirm="onConfirm"
      @cancel="dialog.open = false"
    />
  </main>
  <main class="detail empty" v-else>
    <p>請從左側選擇一筆核銷單</p>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRedemptionStore } from '../../stores/redemption'
import { useToastStore } from '../../stores/toast'
import StatusBadge     from '../shared/StatusBadge.vue'
import StateMachineBar from '../shared/StateMachineBar.vue'
import InfoCard        from '../shared/InfoCard.vue'
import KeyValue        from '../shared/KeyValue.vue'
import ActionBar       from '../shared/ActionBar.vue'
import StatusTimeline  from '../shared/StatusTimeline.vue'
import ConfirmDialog   from '../shared/ConfirmDialog.vue'

const store    = useRedemptionStore()
const toast    = useToastStore()
const { selectedOrder: order } = storeToRefs(store)

const STATE_LABELS = {
  Applied:       '申請中',
  PendingReview: '待核對',
  Reserved:      '已核對（凍結中）',
  Disbursed:     '已發放・待扣除',
  Deducted:      '已結清',
  Rejected:      '已拒',
  Held:          '掛起（停權）',
}
const STATE_VARIANTS = {
  Applied:       'wait',
  PendingReview: 'wait',
  Reserved:      'checked',
  Disbursed:     'issued',
  Deducted:      'ok',
  Rejected:      'danger',
  Held:          'hold',
}

const steps = computed(() => {
  const s = order.value?.status ?? 'PendingReview'
  const isHeld     = s === 'Held'
  const isPending  = s === 'Applied' || s === 'PendingReview' || isHeld
  const isReserved = s === 'Reserved'
  const isDisbursed = s === 'Disbursed'
  const isDone     = s === 'Deducted'
  return [
    { label: '申請',           state: 'done',                                                       lockAfter: false },
    { label: '待核對',         state: isPending ? 'now' : 'done',                                   lockAfter: true  },
    { label: '已核對（凍結）', state: isReserved ? 'now' : (isPending ? 'pending' : 'done'),        lockAfter: true  },
    { label: '已發放',         state: isDisbursed ? 'now' : (isDone ? 'done' : 'pending'),          lockAfter: true  },
    { label: '扣除確認',       state: isDone ? 'now' : 'pending',                                   lockAfter: false },
  ]
})

const DIALOG_CONFIG = {
  confirm:     { title: '確認核對成立？',    body: (o) => `將凍結情報員 #${o.informantId} 積分 <b style="font-family:var(--mono)">${(o.amountPoints ?? 0).toLocaleString()}</b>。凍結後不可再用於其他兌換；發放失敗可解凍退回。` },
  reject:      { title: '確認拒單？',        body: (o) => `此兌換申請 ${o.id} 將被拒絕，積分不扣除。` },
  fillVoucher: { title: '確認回填發放憑證？', body: (o) => `確認已完成 ${(o.amountPoints ?? 0).toLocaleString()} 積分發放，填入憑證後轉為已發放態。` },
  failBack:    { title: '確認發放失敗？',     body: (o) => `將退回待核對並解凍 ${(o.amountPoints ?? 0).toLocaleString()} 積分，請填寫失敗原因。` },
  deduct:      { title: '確認積分扣除？',     body: (o) => `確認扣除情報員 #${o.informantId} 積分、完成結清。` },
}

const dialog = ref({ open: false, action: '', title: '', body: '' })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open: true,
    action,
    title: cfg.title,
    body: cfg.body(order.value),
  }
}

async function onConfirm(reason) {
  try {
    await store.applyAction(order.value.id, dialog.value.action, reason)
    dialog.value.open = false
    toast.success(`已處理・已留跡（${reason}）`)
  } catch (err) {
    toast.error('操作失敗，請稍後重試')
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

.d-head { display: flex; align-items: center; gap: 14px; }
.d-head h2 { font-size: 22px; font-family: var(--mono); }
:deep.op-8-badge { margin-left: auto; font-size: 14px; }
.open-profile {
  margin-left: auto;
  color: var(--accent);
  font-size: 14px;
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 7px 14px;
  white-space: nowrap;
}
.open-profile:hover { background: var(--bg-panel-raised); }

.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.balance-card .big-num { display: flex; align-items: baseline; gap: 4px; }
.balance-card .num { font-family: var(--mono); font-size: 30px; font-weight: 600; }
.balance-card small { color: var(--text-secondary); font-size: 12px; }
.bal-split { display: flex; gap: 18px; font-size: 13px; color: var(--text-secondary); }
.bal-split b { font-family: var(--mono); color: var(--text-primary); }
.ok     { color: var(--ok) !important; }
.danger { color: var(--danger) !important; }

/* ActionBar 內按鈕樣式（透過 CSS 全域作用） */
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
.btn.danger { color: var(--danger); border-color: var(--danger); }
</style>
