<template>
  <div class="mapfilter">
    <button class="mf-btn" @click="open = !open">⚙ 篩選</button>
    <div v-if="open" class="mf-panel">
      <div class="mf-group">
        <b>類型</b>
        <FilterChip
          v-for="opt in typeOpts" :key="opt.value"
          :label="opt.label"
          :active="isActive('types', opt.value)"
          @click="toggle('types', opt.value)"
        />
      </div>
      <div class="mf-group">
        <b>狀態</b>
        <FilterChip
          v-for="opt in statusOpts" :key="opt.value"
          :label="opt.label"
          :active="isActive('statuses', opt.value)"
          @click="toggle('statuses', opt.value)"
        />
      </div>
      <div class="mf-group">
        <b>來源</b>
        <FilterChip
          v-for="opt in sourceOpts" :key="opt.value"
          :label="opt.label"
          :active="isActive('sources', opt.value)"
          @click="toggle('sources', opt.value)"
        />
      </div>
      <button class="mf-clear" @click="clear">清除全部・回到全顯示</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEventsStore } from '../../stores/events'
import FilterChip from './FilterChip.vue'

const evStore = useEventsStore()
const open = ref(false)

const typeOpts   = [
  { label: '路檢', value: 'inspection' },
  { label: '事故', value: 'accident' },
  { label: '施工', value: 'construction' },
  { label: '管制', value: 'control' },
]
const statusOpts = [
  { label: '未確認', value: 'unverified' },
  { label: '已驗證', value: 'verified' },
]
const sourceOpts = [
  { label: '用戶反饋', value: '用戶反饋' },
  { label: '情報網',   value: '情報網' },
  { label: '開放資料', value: '開放資料' },
  { label: '合作通報', value: '合作通報' },
  { label: '感測',     value: '感測' },
]

function isActive(key, value) {
  return evStore.filters[key].includes(value)
}
function toggle(key, value) {
  const arr = [...evStore.filters[key]]
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  evStore.setFilter(key, arr)
}
function clear() {
  evStore.clearFilters()
  open.value = false
}
</script>

<style scoped>
.mapfilter {
  position: absolute;
  left: 668px;
  top: 16px;
  z-index: 21;
}
.mf-btn {
  background: rgba(21, 28, 38, .92);
  border: 1px solid var(--line);
  color: var(--text-primary);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--sans);
  backdrop-filter: blur(6px);
}
.mf-panel {
  margin-top: 8px;
  background: rgba(21, 28, 38, .96);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  display: grid;
  gap: 10px;
  width: 420px;
  backdrop-filter: blur(6px);
}
.mf-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
}
.mf-group b { color: var(--text-secondary); font-weight: 500; width: 34px; }
.mf-clear {
  background: none;
  border: 1px dashed var(--line);
  color: var(--accent);
  border-radius: 8px;
  padding: 7px 0;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--sans);
}
.mf-clear:hover { border-color: var(--accent); }
</style>
