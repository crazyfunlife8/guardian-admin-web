<!-- 資訊卡：bg-panel + border + rounded，用 slot 填欄位 -->
<template>
  <div class="card" :class="{ wide }">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  wide:  { type: Boolean, default: false },
})
</script>

<style scoped>
.card {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
  display: grid;
  gap: 10px;
  align-content: start;
}
h3 {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: .05em;
}
</style>
