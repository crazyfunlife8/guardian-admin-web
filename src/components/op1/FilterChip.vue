<template>
  <span class="chip" :class="{ on: active }" @click="$emit('click')">{{ label }}</span>
</template>

<script setup>
defineProps({ label: String, active: Boolean })
defineEmits(['click'])
</script>

<style scoped>
.chip {
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 12px;
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.chip.on { color: var(--accent); border-color: var(--accent); }
</style>
