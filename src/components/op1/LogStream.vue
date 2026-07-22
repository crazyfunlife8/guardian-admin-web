<template>
  <section class="log">
    <div class="panel-head">
      <h2>運行日誌流</h2>
      <div class="filters">
        <span
          v-for="f in filterOptions"
          :key="f.key"
          class="chip"
          :class="{ on: activeTag === f.key }"
          @click="logsStore.setTag(f.key)"
        >{{ f.label }}</span>
      </div>
      <button class="collapse" @click="collapsed = !collapsed">
        {{ collapsed ? '展開 ▴' : '收合 ▾' }}
      </button>
    </div>
    <ol v-if="!collapsed">
      <li
        v-for="entry in visibleLogs"
        :key="entry.id"
        :class="{ new: entry.isNew }"
        @click="$emit('log-click', entry)"
      >
        <time>{{ entry.time }}</time>
        <span class="tag" :class="entry.tag">{{ TAG_LABELS[entry.tag] }}</span>
        <span class="text">{{ entry.text }}</span>
        <span class="go">→ {{ entry.link }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLogsStore } from '../../stores/logs'

defineEmits(['log-click'])

const logsStore = useLogsStore()
const { visibleLogs, activeTag } = storeToRefs(logsStore)

const TAG_LABELS = { ev: '事件', task: '任務', alert: '管線', human: '人工', abuse: '反濫用' }
const collapsed = ref(false)

const filterOptions = [
  { key: 'all',   label: '全部' },
  { key: 'ev',    label: '事件' },
  { key: 'task',  label: '任務' },
  { key: 'alert', label: '管線' },
  { key: 'human', label: '人工' },
  { key: 'abuse', label: '反濫用' },
]
</script>

<style scoped>
.log {
  position: absolute;
  left: 312px;
  right: 16px;
  bottom: 16px;
  height: 236px;
  background: rgba(21, 28, 38, .94);
  border: 1px solid var(--line);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(6px);
  z-index: 20;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.panel-head h2 { font-size: 16px; font-weight: 600; white-space: nowrap; }
.filters { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
.collapse {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--sans);
  white-space: nowrap;
}

.chip {
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: color .15s, border-color .15s;
}
.chip.on { color: var(--accent); border-color: var(--accent); }

ol {
  list-style: none;
  overflow-y: auto;
  flex: 1;
  padding: 6px 0;
}
li {
  display: flex;
  gap: 14px;
  align-items: baseline;
  padding: 7px 16px;
  font-size: 14px;
  border-bottom: 1px solid rgba(42, 53, 71, .35);
  cursor: pointer;
}
li:hover { background: var(--bg-panel-raised); }
li.new { animation: slidein .2s ease-out; }

time { font-family: var(--mono); color: var(--text-secondary); font-size: 13px; flex: none; }
.text { flex: 1; }
.tag {
  flex: none;
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 8px;
  letter-spacing: .05em;
}
.tag.ev    { background: rgba(63, 183, 126, .15); color: var(--ok); }
.tag.task  { background: rgba(88, 193, 212, .15); color: var(--info); }
.tag.alert { background: rgba(229, 96, 76, .18);  color: var(--danger); }
.tag.human { background: rgba(76, 154, 255, .15); color: var(--accent); }
.tag.abuse { background: rgba(229, 184, 75, .15); color: var(--warn); }

.go { margin-left: auto; color: var(--text-secondary); opacity: 0; font-size: 12px; flex: none; }
li:hover .go { opacity: 1; }
</style>
