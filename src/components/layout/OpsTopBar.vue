<template>
  <header class="topbar">
    <RouterLink class="back" to="/op1">← 返回監控</RouterLink>
    <span class="crumb">作業模式 ／ <b>{{ title }}</b></span>
    <div class="top-right">
      <span class="clock">{{ clock }}</span>
      <span class="account">值班：<b>OP-07</b>・營運員</span>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({ title: { type: String, required: true } })

const clock = ref('')
function tick() {
  const d = new Date()
  clock.value = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
}
tick()
let timer
onMounted(() => { timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.topbar {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--line);
}
.back {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 12px;
  white-space: nowrap;
}
.back:hover { background: var(--bg-panel-raised); }
.crumb { font-size: 14px; color: var(--text-secondary); }
.crumb b { color: var(--text-primary); font-weight: 600; font-size: 16px; }
.top-right { margin-left: auto; display: flex; align-items: center; gap: 16px; }
.clock { font-family: var(--mono); font-size: 18px; font-weight: 600; }
.account { font-size: 13px; color: var(--text-secondary); }
.account b { color: var(--text-primary); font-weight: 500; }
</style>
