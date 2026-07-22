<template>
  <div class="search">
    <span class="icon">🔍</span>
    <input
      v-model="query"
      placeholder="路名／路口定位（例：環河南路二段 市民高架）"
      @keydown.escape="query = ''"
    />
    <kbd>/</kbd>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const query = ref('')
</script>

<style scoped>
.search {
  position: absolute;
  left: 308px;
  top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(21, 28, 38, .92);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 14px;
  width: 340px;
  backdrop-filter: blur(6px);
  z-index: 21;
}
.icon { flex: none; }
input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 15px;
  font-family: var(--sans);
  min-width: 0;
}
input::placeholder { color: var(--text-secondary); }
kbd {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-secondary);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
  flex: none;
}
</style>
