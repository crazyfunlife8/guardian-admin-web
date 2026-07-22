<template>
  <div class="legend">
    <b>圖例</b>
    <div class="row">
      <MarkerIcon type="inspection"   :grey="true" :size="14" /> 路檢
      <MarkerIcon type="accident"     :grey="true" :size="14" /> 事故
      <MarkerIcon type="construction" :grey="true" :size="12" /> 施工
      <MarkerIcon type="control"      :grey="true" :size="13" /> 管制
    </div>
    <div class="row">
      <span class="dot warn"></span> 未確認
      <span class="dot ok"></span> 已驗證
    </div>
    <div class="row">
      ◌ 廣播中　○ 已接
      <span class="danger">◎</span> 逾時擴半徑
      <span class="warn">⚠</span> 掛點
    </div>
  </div>
</template>

<script setup>
import MarkerIcon from './MarkerIcon.vue'
</script>

<style scoped>
.legend {
  position: absolute;
  right: 16px;
  bottom: 268px;
  background: rgba(21, 28, 38, .92);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--text-secondary);
  display: grid;
  gap: 8px;
  z-index: 20;
  backdrop-filter: blur(6px);
}
.legend b { color: var(--text-primary); font-weight: 500; font-size: 12px; }
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.dot.warn { background: var(--warn); }
.dot.ok   { background: var(--ok); }
.warn   { color: var(--warn); }
.danger { color: var(--danger); }
</style>
