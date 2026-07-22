<template>
  <div class="op1-layout">
    <TopBar @source-click="onSourceClick" @menu-click="menuOpen = true" />
    <div class="stage">
      <MapCanvas />
      <TodoPanel @item-click="onTodoClick" />
      <LogStream @log-click="onLogClick" />
    </div>
  </div>

  <OpsMenu :open="menuOpen" @close="menuOpen = false" />
</template>

<script setup>
import { ref } from 'vue'
import TopBar    from '../components/op1/TopBar.vue'
import MapCanvas from '../components/op1/MapCanvas.vue'
import TodoPanel from '../components/op1/TodoPanel.vue'
import LogStream from '../components/op1/LogStream.vue'
import OpsMenu   from '../components/op1/OpsMenu.vue'

const menuOpen = ref(false)

function onSourceClick(id) {
  console.log('source detail:', id)
  // TODO: 跳到來源詳情頁（未來 OP 頁面）
}
function onTodoClick(key) {
  console.log('todo nav:', key)
}
function onLogClick(entry) {
  console.log('log detail:', entry)
  // TODO: 跳到對應地圖標記或詳情頁
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
