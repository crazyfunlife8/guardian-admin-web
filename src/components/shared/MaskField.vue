<!-- 個資遮罩欄位：預設 ●●● + 解除遮罩鈕 -->
<template>
  <span class="field">
    <span v-if="masked" class="masked">{{ maskedText }}</span>
    <span v-else class="revealed">{{ value }}</span>
    <button class="unmask" @click="toggle">{{ masked ? '解除遮罩' : '重新遮罩' }}</button>
  </span>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  value:      { type: String, required: true },
  maskedText: { type: String, default: '●●●-●●●●●●-●●●' },
})
const emit = defineEmits(['unmask'])

const masked = ref(true)

function toggle() {
  if (masked.value) {
    emit('unmask')   // 呼叫方負責彈確認對話框後再 unmask
  } else {
    masked.value = true
  }
}

function reveal() { masked.value = false }
defineExpose({ reveal })
</script>

<style scoped>
.field { display: inline-flex; align-items: center; gap: 8px; }
.masked   { font-family: var(--mono); color: var(--mask); letter-spacing: 2px; }
.revealed { font-family: var(--mono); }
.unmask {
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  border: none;
  background: none;
  font-family: var(--sans);
  padding: 0;
}
.unmask:hover { text-decoration: underline; }
</style>
