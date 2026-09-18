<template>
  <div class="op1-layout">
    <TopBar
      :theater-mode="theaterMode"
      @source-click="onSourceClick"
      @menu-click="menuOpen = true"
      @theater-toggle="theaterMode = !theaterMode"
    />
    <div class="stage" :style="{ '--log-h': logCollapsed ? '46px' : '236px', '--todo-w': theaterMode ? '320px' : '280px' }">
      <MapCanvas />
      <TodoPanel :theater-mode="theaterMode" @item-click="onTodoClick" />
      <LogStream v-model:collapsed="logCollapsed" @log-click="onLogClick" />
    </div>
  </div>

  <OpsMenu :open="menuOpen" @close="menuOpen = false" @manual-event="manualEventOpen = true" />
  <Toast />

  <!-- 手動建事件 Modal (D5) -->
  <Teleport to="body">
    <div v-if="manualEventOpen" class="me-backdrop" @click.self="manualEventOpen = false">
      <div class="me-modal">
        <div class="me-head">
          <span>手動建事件（D5）</span>
          <button class="me-close" @click="manualEventOpen = false">✕</button>
        </div>
        <div class="me-body">
          <label class="me-label">事件類型 <span class="req">*</span></label>
          <select v-model="meForm.type" class="me-input">
            <option value="Checkpoint">Checkpoint（臨檢）</option>
            <option value="Accident">Accident（事故）</option>
            <option value="Construction">Construction（施工）</option>
            <option value="Control">Control（管制）</option>
            <option value="Flooding">Flooding（積水）</option>
          </select>
          <label class="me-label">緯度 (lat) <span class="req">*</span></label>
          <input v-model.number="meForm.lat" type="number" step="0.000001" class="me-input" placeholder="例：25.033" />
          <label class="me-label">經度 (lng) <span class="req">*</span></label>
          <input v-model.number="meForm.lng" type="number" step="0.000001" class="me-input" placeholder="例：121.565" />
          <label class="me-label">方向（選填）</label>
          <input v-model="meForm.direction" type="text" class="me-input" placeholder="例：北向" />
          <label class="me-label">路段名稱（選填）</label>
          <input v-model="meForm.roadName" type="text" class="me-input" placeholder="例：中山北路" />
          <label class="me-label">TTL（分鐘，選填）</label>
          <input v-model.number="meForm.ttlMinutes" type="number" class="me-input" placeholder="預設使用系統設定" min="1" />
        </div>
        <div class="me-foot">
          <button class="me-btn" @click="manualEventOpen = false">取消</button>
          <button class="me-btn primary" :disabled="!meForm.type || !meForm.lat || !meForm.lng || meSubmitting" @click="submitManualEvent">
            {{ meSubmitting ? '送出中…' : '建立事件' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar    from '../components/op1/TopBar.vue'
import MapCanvas from '../components/op1/MapCanvas.vue'
import TodoPanel from '../components/op1/TodoPanel.vue'
import LogStream from '../components/op1/LogStream.vue'
import OpsMenu   from '../components/op1/OpsMenu.vue'
import Toast     from '../components/shared/Toast.vue'
import { useLogsStore }      from '../stores/logs'
import { useSourcesStore }   from '../stores/sources'
import { useDashboardStore } from '../stores/dashboard'
import { useAuthStore }      from '../stores/auth'
import { useEventsStore }    from '../stores/events'
import { useToastStore }     from '../stores/toast'

const router       = useRouter()
const menuOpen     = ref(false)
const theaterMode  = ref(false)
const logCollapsed = ref(false)

// 手動建事件
const manualEventOpen = ref(false)
const meSubmitting    = ref(false)
const meForm = reactive({ type: 'Checkpoint', lat: null, lng: null, direction: '', roadName: '', ttlMinutes: null })

const evStore    = useEventsStore()
const toastStore = useToastStore()

async function submitManualEvent() {
  if (!meForm.type || !meForm.lat || !meForm.lng || meSubmitting.value) return
  meSubmitting.value = true
  try {
    const body = {
      type:      meForm.type,
      lat:       meForm.lat,
      lng:       meForm.lng,
      sourceKey: 'manual',
      ...(meForm.direction  ? { direction:  meForm.direction  } : {}),
      ...(meForm.roadName   ? { roadName:   meForm.roadName   } : {}),
      ...(meForm.ttlMinutes ? { ttlMinutes: meForm.ttlMinutes } : {}),
    }
    const res = await evStore.createManualEvent(body)
    toastStore.success(`事件已建立 #${res?.id ?? '—'}`)
    manualEventOpen.value = false
    Object.assign(meForm, { type: 'Checkpoint', lat: null, lng: null, direction: '', roadName: '', ttlMinutes: null })
  } catch (err) {
    toastStore.error(err?.response?.data?.message ?? '建立失敗，請重試')
  } finally {
    meSubmitting.value = false
  }
}

const logsStore    = useLogsStore()
const sourcesStore = useSourcesStore()
const dashStore    = useDashboardStore()
const authStore    = useAuthStore()

watch(theaterMode, (val) => { if (val) logCollapsed.value = true })

onMounted(() => {
  if (!authStore.user) authStore.fetchMe()
  dashStore.startPoll()
  logsStore.connect()
  sourcesStore.startPoll()
})
onUnmounted(() => {
  dashStore.stopPoll()
  logsStore.disconnect()
  sourcesStore.stopPoll()
})

function onSourceClick(id) {
  console.log('source detail:', id)
}
function onTodoClick(key) {
  // overdue-task / stale 暫無指定跳轉目標，保留供日後補充
  console.log('todo nav:', key)
}
function onLogClick(entry) {
  if (entry.navTo) router.push(entry.navTo)
  // navTo === null：ev/task 待地圖 fly-to 串接；alert 斷源留在當頁
}
</script>

<style scoped>
.op1-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.stage {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 手動建事件 modal */
.me-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}
.me-modal {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  width: 380px;
  max-width: calc(100vw - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0,0,0,.5);
}
.me-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
  font-weight: 600;
}
.me-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 15px;
  padding: 2px 6px;
  border-radius: 5px;
}
.me-close:hover { color: var(--text-primary); }
.me-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 60vh;
  overflow-y: auto;
}
.me-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}
.req { color: var(--danger); }
.me-input {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--sans);
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
}
.me-foot {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
}
.me-btn {
  border-radius: 7px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--sans);
}
.me-btn:hover:not(:disabled) { background: var(--bg-panel-raised); }
.me-btn.primary { background: var(--accent); border-color: var(--accent); color: #08111F; font-weight: 600; }
.me-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.me-btn:disabled { opacity: .4; cursor: not-allowed; }
</style>
