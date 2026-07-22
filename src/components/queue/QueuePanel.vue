<!-- 左佇列殼層（版型 A 共用）
  Props:
    title:       String
    count:       Number
    filters:     [{ label, key }]
    activeFilter: String
    addLabel:    String? — 有值才顯示建單鈕
  Emits:
    filter-change(key)
    add-click
-->
<template>
  <aside class="queue">
    <div class="q-head">
      <h1>
        {{ title }}
        <span class="count-badge">{{ count }}</span>
        <button v-if="addLabel" class="add-btn" @click="$emit('add-click')">＋ {{ addLabel }}</button>
      </h1>
      <div class="q-filters">
        <span
          v-for="f in filters"
          :key="f.key"
          class="chip"
          :class="{ on: activeFilter === f.key }"
          @click="$emit('filter-change', f.key)"
        >{{ f.label }}</span>
      </div>
    </div>

    <ul class="q-list">
      <slot />
    </ul>

    <div class="kbd-hint">
      <kbd>↑</kbd><kbd>↓</kbd> 選件・<kbd>Enter</kbd> 開處理・處理完自動跳下一筆
    </div>
  </aside>
</template>

<script setup>
defineProps({
  title:        { type: String, required: true },
  count:        { type: Number, default: 0 },
  filters:      { type: Array,  default: () => [] },
  activeFilter: { type: String, default: '' },
  addLabel:     { type: String, default: '' },
})
defineEmits(['filter-change', 'add-click'])
</script>

<style scoped>
.queue {
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-panel);
}
.q-head { padding: 14px 16px; border-bottom: 1px solid var(--line); }
h1 {
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.count-badge {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--warn);
  color: #1A1405;
}
.add-btn {
  margin-left: auto;
  font-size: 13px;
  font-family: var(--sans);
  color: var(--accent);
  background: none;
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
}
.add-btn:hover { background: rgba(76,154,255,.12); }

.q-filters { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
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

.q-list { flex: 1; overflow-y: auto; list-style: none; }

.kbd-hint {
  padding: 9px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}
.kbd-hint kbd {
  font-family: var(--mono);
  font-size: 11px;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0 5px;
  margin: 0 2px;
}
</style>
