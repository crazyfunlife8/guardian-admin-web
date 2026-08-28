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

  <OpsMenu :open="menuOpen" @close="menuOpen = false" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar    from '../components/op1/TopBar.vue'
import MapCanvas from '../components/op1/MapCanvas.vue'
import TodoPanel from '../components/op1/TodoPanel.vue'
import LogStream from '../components/op1/LogStream.vue'
import OpsMenu   from '../components/op1/OpsMenu.vue'
import { useLogsStore }      from '../stores/logs'
import { useSourcesStore }   from '../stores/sources'
import { useDashboardStore } from '../stores/dashboard'
import { useAuthStore }      from '../stores/auth'

const router       = useRouter()
const menuOpen     = ref(false)
const theaterMode  = ref(false)
const logCollapsed = ref(false)

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
  // TODO: 跳到來源詳情頁（未來 OP 頁面）
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
</style>
