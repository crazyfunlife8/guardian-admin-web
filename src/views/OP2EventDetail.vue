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
          </template>
          <p v-else class="no-task">此事件無對應驗證任務</p>
        </InfoCard>
      </div>

      <!-- 4. 動作列 -->
      <ActionBar v-if="!isTerminated">
        <template v-if="event.status === 'unverified'">
          <button class="btn primary" @click="openDialog('confirm')">確認為真</button>
          <button class="btn"         @click="openDialog('takedown')">誤報下架</button>
          <button class="btn"         @click="openDialog('extend')">延長 TTL ＋30 分</button>
          <button class="btn"         @click="openDialog('dispatch')">轉內部派遣</button>
        </template>
        <template v-else-if="event.status === 'verified'">
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
    </div>

    <!-- 確認對話框 -->
    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      @confirm="onConfirm"
      @cancel="dialog.open = false"
    />
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute }      from 'vue-router'
import { useEventsStore } from '../stores/events'
import { useToastStore }  from '../stores/toast'
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

const TYPE_LABELS = { inspection: '臨時路檢', accident: '事故', construction: '施工', control: '管制' }

const isTerminated = computed(() => event.value?.status === 'cleared')

// 事件狀態機步驟
const steps = computed(() => {
  const s = event.value?.status ?? 'unverified'
  const isCleared  = s === 'cleared'
  const isVerified = s === 'verified'
  return [
    { label: '建立（未確認）', state: 'done',                                    lockAfter: false },
    { label: '已驗證',        state: isVerified ? 'now' : (isCleared ? 'done' : 'pending'), lockAfter: true },
    { label: '已解除',        state: isCleared  ? 'now' : 'pending',             lockAfter: false },
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

const dialog = ref({ open: false, action: '', title: '', body: '' })

function openDialog(action) {
  const cfg = DIALOG_CONFIG[action]
  dialog.value = { open: true, action, title: cfg.title, body: cfg.body(event.value) }
}

function onConfirm(reason) {
  evStore.applyEventAction(event.value.id, dialog.value.action, reason)
  dialog.value.open = false
  toastStore.success('已處理・已留跡')
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
