<!-- 狀態徽章：pill 形、對應語意色 -->
<!-- variant: wait | checked | issued | hold | ok | danger | info | zero -->
<template>
  <span class="badge" :class="variant">{{ label }}</span>
</template>

<script setup>
defineProps({
  label:   { type: String, required: true },
  variant: { type: String, default: 'wait' },
})
</script>

<style scoped>
.badge {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 10px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.wait    { background: rgba(229,184,75,.15); color: var(--warn);   border-color: var(--warn); }
.checked { background: rgba(88,193,212,.15); color: var(--info);   border-color: var(--info); }
.issued  { background: rgba(88,193,212,.15); color: var(--info);   border-color: var(--info); }
.hold    { background: rgba(229,96,76,.15);  color: var(--danger); border-color: var(--danger); }
.ok      { background: rgba(63,183,126,.15); color: var(--ok);     border-color: var(--ok); }
.danger  { background: rgba(229,96,76,.15);  color: var(--danger); border-color: var(--danger); }
.info    { background: rgba(88,193,212,.15); color: var(--info);   border-color: var(--info); }
.zero    { background: none; color: var(--text-secondary); border-color: var(--line); }
</style>
