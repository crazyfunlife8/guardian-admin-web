<template>
  <!-- 404 態 -->
  <div v-if="!event" class="not-found">
    <OpsTopBar title="事件詳情（OP-2）" />
    <div class="center">
      <p>找不到事件 {{ route.params.eventId }}</p>
      <RouterLink to="/op1" class="back-link">← 返回監控主頁</RouterLink>
    </div>
  </div>

  <!-- 詳情態 -->
  <div v-else class="op2-root">
    <OpsTopBar :title="`事件詳情（OP-2）— ${event.id}`" />

    <div class="content">
      <!-- 1. 身分列 -->
      <EventIdentityBar :event="event" />

      <!-- 2. 狀態機流轉條 -->
      <StateMachineBar :steps="steps" />

      <!-- 3. 資訊卡雙欄 -->
      <div class="cards">
        <InfoCard title="事件內容">
          <KeyValue label="事件類型"  :value="TYPE_LABELS[event.type]" />
          <KeyValue label="路段與方向" :value="event.road" />
          <KeyValue label="資料來源"  :value="event.source" />
          <KeyValue label="最新回報"  :value="event.reportedAgo" />
          <KeyValue v-if="event.ttlMin != null" label="TTL 剩餘">
            <span class="mono" :class="{ 'warn': event.ttlMin <= 10 }">{{ event.ttlMin }} 分</span>
          </KeyValue>
        </InfoCard>

        <InfoCard title="驗證任務狀態">
          <template v-if="event.taskStatus">
            <KeyValue label="任務狀態" :value="event.taskStatus"
              :ok-color="event.taskStatus === '已接'"
              :danger-color="event.taskStatus === '逾時'" />
            <KeyValue v-if="event.taskInformant" label="接單情報員" :value="event.taskInformant" mono />
            <KeyValue v-if="event.taskRadius"    label="廣播半徑"   :value="`第 ${event.taskRadius} 檔`" />
            <!-- 擴大廣播半徑（僅 Broadcasting 狀態） -->
            <div v-if="event.taskStatus === 'Broadcasting' && event.taskId" class="task-form">
              <input v-model.number="expandRadius" type="number" class="mini-input" placeholder="新半徑（公尺）" min="100" />
              <button class="btn-sm" :disabled="!expandRadius || expandingTask" @click="submitExpandTask">
                {{ expandingTask ? '處理中…' : '擴大廣播半徑' }}
              </button>
            </div>
          </template>
          <template v-else-if="!isTerminated">
            <p class="no-task">此事件尚無驗證任務</p>
            <div class="task-form">
              <select v-model="taskKind" class="mini-select">
                <option value="Verify">Verify（初次查核）</option>
                <option value="Recheck">Recheck（複查）</option>
              </select>
              <input v-model.number="taskBounty" type="number" class="mini-input" placeholder="賞金（積分，選填）" min="1" />
              <input v-model.number="taskRadius" type="number" class="mini-input" placeholder="廣播半徑（選填，公尺）" min="100" />
              <button class="btn-sm primary" :disabled="generatingTask" @click="submitGenerateTask">
                {{ generatingTask ? '生成中…' : '生成任務' }}
              </button>
            </div>
          </template>
          <p v-else class="no-task">此事件無對應驗證任務</p>
        </InfoCard>
      </div>

      <!-- 4. 動作列 -->
      <ActionBar v-if="!isTerminated">
        <template v-if="event.status === 'Unconfirmed'">
          <button class="btn primary" @click="openDialog('confirm')">確認為真</button>
          <button class="btn"         @click="openDialog('takedown')">誤報下架</button>
          <button class="btn"         @click="openDialog('extend')">延長 TTL ＋30 分</button>
          <button class="btn"         @click="openDialog('dispatch')">轉內部派遣</button>
        </template>
        <template v-else-if="event.status === 'Verified'">
          <button class="btn primary" @click="openDialog('resolve')">已解除</button>
          <button class="btn"         @click="openDialog('extend')">延長 TTL ＋30 分</button>
          <button class="btn"         @click="openDialog('dispatch')">轉內部派遣</button>
        </template>
      </ActionBar>

      <!-- 5. 時間軸 -->
      <StatusTimeline
        title="狀態機歷程（時間・執行者・依據缺一不可）"
        :entries="timelineEntries"
      />

      <!-- 6. 派遣紀錄 -->
      <InfoCard v-if="dispatches.length" title="派遣紀錄（O-4）">
        <div v-for="d in dispatches" :key="d.id" class="dispatch-row">
          <div class="dispatch-meta">
            <span class="mono">派遣 #{{ d.id }}</span>
            <span class="dispatch-status" :class="d.status === 'Dispatched' ? 'warn' : ''">
              {{ d.status === 'Dispatched' ? '⬤ 處理中' : d.status === 'Completed' ? '✓ 已完成' : '✗ 已取消' }}
            </span>
          </div>
          <div v-if="d.status === 'Dispatched'" class="dispatch-actions">
            <select v-model="dispatchResults[d.id]" class="mini-select">
              <option value="">選擇查核結果…</option>
              <option value="Present">在（仍存在）</option>
              <option value="Absent">不在</option>
              <option value="Cleared">已解除</option>
              <option value="FalseReport">誤報</option>
            </select>
            <button class="btn-sm primary" :disabled="!dispatchResults[d.id]" @click="onCompleteDispatch(d.id)">完成回報</button>
          </div>
        </div>
      </InfoCard>
    </div>

    <!-- 確認對話框 -->
    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      v-bind="dialog.reasons !== undefined ? { reasons: dialog.reasons } : {}"
      @confirm="onConfirm"
      @cancel="dialog.open = false"
    />
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute }      from 'vue-router'
import { useEventsStore } from '../stores/events'
import { useToastStore }  from '../stores/toast'
import { TYPE_LABELS, STATUS_LABELS } from '../stores/events'
import OpsTopBar         from '../components/layout/OpsTopBar.vue'
import EventIdentityBar  from '../components/op2/EventIdentityBar.vue'
import StateMachineBar   from '../components/shared/StateMachineBar.vue'
import InfoCard          from '../components/shared/InfoCard.vue'
import KeyValue          from '../components/shared/KeyValue.vue'
import ActionBar         from '../components/shared/ActionBar.vue'
import StatusTimeline    from '../components/shared/StatusTimeline.vue'
import ConfirmDialog     from '../components/shared/ConfirmDialog.vue'
import Toast             from '../components/shared/Toast.vue'

const route      = useRoute()
const evStore    = useEventsStore()
const toastStore = useToastStore()

const event = computed(() => evStore.getById(route.params.eventId))

// 任務生成
const taskKind       = ref('Verify')
const taskBounty     = ref(null)
const taskRadius     = ref(null)
const generatingTask = ref(false)

// 擴大廣播半徑
const expandRadius  = ref(null)
const expandingTask = ref(false)

// 派遣佇列
const dispatches      = ref([])
const dispatchResults = reactive({})

onMounted(async () => {
  if (!event.value) await evStore.fetchEvent(route.params.eventId)
  _loadDispatches()
})

async function _loadDispatches() {
  try {
    const all = await evStore.fetchDispatches()
    dispatches.value = all.filter(d => String(d.eventId) === String(route.params.eventId))
  } catch (_) {}
}

async function submitGenerateTask() {
  if (generatingTask.value) return
  generatingTask.value = true
  try {
    const res = await evStore.generateTask(
      event.value.id,
      taskKind.value,
      taskBounty.value || undefined,
      taskRadius.value || undefined,
    )
    toastStore.success(`任務 #${res.taskId} 已生成，廣播 ${res.broadcastRadius}m，${res.eligibleInformants} 位情報員`)
    taskBounty.value = null
    taskRadius.value = null
  } catch (err) {
    toastStore.error(err?.response?.data?.message ?? '生成失敗，請重試')
  } finally {
    generatingTask.value = false
  }
}

async function submitExpandTask() {
  if (!expandRadius.value || expandingTask.value || !event.value.taskId) return
  expandingTask.value = true
  try {
    await evStore.expandTask(event.value.taskId, expandRadius.value)
    toastStore.success('廣播半徑已擴大')
    expandRadius.value = null
    await evStore.fetchEvent(event.value.id)
  } catch (err) {
    toastStore.error(err?.response?.data?.message ?? '擴大失敗，請重試')
  } finally {
    expandingTask.value = false
  }
}

async function onCompleteDispatch(dispatchId) {
  const result = dispatchResults[dispatchId]
  if (!result) return
  try {
    await evStore.completeDispatch(dispatchId, result, '')
    toastStore.success('派遣已完成，事件狀態已更新')
    await Promise.all([_loadDispatches(), evStore.fetchEvent(event.value.id)])
  } catch (err) {
    toastStore.error(err?.response?.data?.message ?? '完成派遣失敗，請重試')
  }
}

const isTerminated = computed(() =>
  ['Cleared', 'FalseReport', 'Expired'].includes(event.value?.status)
)

// 事件狀態機步驟
const steps = computed(() => {
  const s = event.value?.status ?? 'Unconfirmed'
  const isCleared    = ['Cleared', 'FalseReport', 'Expired'].includes(s)
  const isVerified   = s === 'Verified'
  const isFalseReport = s === 'FalseReport'
  return [
    { label: '建立（未確認）', state: 'done',                                              lockAfter: false },
    { label: '已驗證',        state: isVerified ? 'now' : (isCleared ? 'done' : 'pending'), lockAfter: true },
    { label: isFalseReport ? '誤報下架' : '已解除',
                              state: isCleared   ? 'now' : 'pending',                      lockAfter: false },
  ]
})

// 時間軸：將 history 轉成 StatusTimeline 格式
const timelineEntries = computed(() =>
  (event.value?.history ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1 || isTerminated.value,
  }))
)

// 對話框
const DIALOG_CONFIG = {
  confirm:  { title: '確認事件為真？',     body: (e) => `將 ${e.id}（${TYPE_LABELS[e.type]}）升為已驗證。若後續無法確認，可標記已解除。` },
  takedown: { title: '確認誤報下架？',     body: (e) => `將 ${e.id} 判定為誤報並下架，事件從地圖消失。此操作留跡。` },
  resolve:  { title: '確認標記已解除？',   body: (e) => `${e.id}（${e.road}）事件狀況已結束。` },
  extend:   { title: '確認延長 TTL ＋30 分？', body: (e) => `目前剩餘 ${e.ttlMin} 分，延長後為 ${(e.ttlMin ?? 0) + 30} 分。` },
  dispatch: { title: '確認轉內部派遣？',   body: (e) => `將 ${e.id} 指派專職小隊處理，結果以「內部查核」回寫時間軸。` },
}

const NO_REASON_ACTIONS = new Set(['extend', 'dispatch'])
const dialog = ref({ open: false, action: '', title: '', body: '', reasons: undefined })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = {
    open: true,
    action,
    title: cfg.title,
    body:  cfg.body(event.value),
    reasons: NO_REASON_ACTIONS.has(action) ? [] : undefined,
  }
}

async function onConfirm(reason) {
  try {
    await evStore.applyEventAction(event.value.id, dialog.value.action, reason)
    toastStore.success('已處理・已留跡')
  } catch (err) {
    toastStore.error(err?.response?.data?.message ?? '操作失敗，請重試')
  } finally {
    dialog.value.open = false
  }
}
</script>

<style scoped>
.op2-root, .not-found {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.no-task {
  font-size: 14px;
  color: var(--text-secondary);
}

.mono { font-family: var(--mono); }
.warn { color: var(--danger); }

/* ActionBar slot 按鈕 */
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
.btn:hover   { background: var(--bg-panel-raised); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.1); }

/* 任務生成 / 擴大半徑 */
.task-form {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.mini-input, .mini-select {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 6px 10px;
  height: 34px;
}
.mini-input { width: 130px; }
.mini-select { cursor: pointer; }
.btn-sm {
  border-radius: 6px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--sans);
  height: 34px;
  white-space: nowrap;
}
.btn-sm:hover:not(:disabled) { background: var(--bg-panel-raised); }
.btn-sm.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.btn-sm.primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-sm:disabled { opacity: .4; cursor: not-allowed; }

/* 派遣紀錄 */
.dispatch-row { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.dispatch-row:last-child { border-bottom: none; }
.dispatch-meta { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.dispatch-status { font-size: 13px; color: var(--text-secondary); }
.dispatch-status.warn { color: var(--warn); }
.dispatch-actions { display: flex; gap: 8px; align-items: center; }

/* 404 */
.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}
.back-link { color: var(--accent); text-decoration: none; font-size: 14px; }
</style>
