<!-- 鍵值行：k 左、v 右 -->
<template>
  <div class="kv">
    <span class="k">{{ label }}</span>
    <span class="v" :class="{ mono, ok: okColor, danger: dangerColor }">
      <slot>{{ value }}</slot>
    </span>
  </div>
</template>

<script setup>
defineProps({
  label:       { type: String, required: true },
  value:       { type: [String, Number], default: '' },
  mono:        { type: Boolean, default: false },
  okColor:     { type: Boolean, default: false },
  dangerColor: { type: Boolean, default: false },
})
</script>

<style scoped>
.kv { display: flex; justify-content: space-between; font-size: 15px; }
.k  { color: var(--text-secondary); }
.v  { font-weight: 500; }
.v.mono    { font-family: var(--mono); }
.v.ok      { color: var(--ok); }
.v.danger  { color: var(--danger); }
</style>
