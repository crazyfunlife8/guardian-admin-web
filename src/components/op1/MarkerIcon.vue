<template>
  <!-- 形狀＝事件類型，填色＝狀態 -->
  <svg :width="w" :height="h" :viewBox="vb" class="marker-icon">
    <!-- 路檢：盾型 -->
    <path v-if="type === 'inspection'"
      d="M13 1 L25 6 V15 C25 23 19 27 13 29 C7 27 1 23 1 15 V6 Z"
      :fill="color" stroke="#0D1117" stroke-width="1.5"
    />
    <!-- 事故：三角 -->
    <path v-else-if="type === 'accident'"
      d="M13 1 L25 22 H1 Z"
      :fill="color" stroke="#0D1117" stroke-width="1.5"
    />
    <!-- 施工：方形 -->
    <rect v-else-if="type === 'construction'"
      x="1" y="1" width="20" height="20" rx="3"
      :fill="color" stroke="#0D1117" stroke-width="1.5"
    />
    <!-- 管制：六邊形 -->
    <path v-else-if="type === 'control'"
      d="M12 1 L22 7 V17 L12 23 L2 17 V7 Z"
      :fill="color" stroke="#0D1117" stroke-width="1.5"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type:   { type: String, required: true },
  status: { type: String, default: 'unverified' },
  size:   { type: Number, default: 26 },
  grey:   { type: Boolean, default: false },
})

const STATUS_COLORS = {
  unverified: '#E5B84B',
  verified:   '#3FB77E',
  cleared:    '#6B7A92',
}
const TYPE_VIEWBOXES = {
  inspection:   { vb: '0 0 26 30', w: 26, h: 30 },
  accident:     { vb: '0 0 26 24', w: 26, h: 24 },
  construction: { vb: '0 0 22 22', w: 22, h: 22 },
  control:      { vb: '0 0 24 24', w: 24, h: 24 },
}

const meta = computed(() => TYPE_VIEWBOXES[props.type] ?? TYPE_VIEWBOXES.inspection)
const vb = computed(() => meta.value.vb)
const scale = computed(() => props.size / Math.max(meta.value.w, meta.value.h))
const w = computed(() => Math.round(meta.value.w * scale.value))
const h = computed(() => Math.round(meta.value.h * scale.value))
const color = computed(() => props.grey ? '#9AA7BA' : (STATUS_COLORS[props.status] ?? '#9AA7BA'))
</script>

<style scoped>
.marker-icon { display: block; }
</style>
