<template>
  <header class="topbar" :class="{ theater: theaterMode }">
    <template v-if="!theaterMode">
      <div class="brand">
        <b>守護者・營運後台</b>
        <span class="mode">監控模式</span>
      </div>

      <div class="sources" title="七源進料健康（hover 看近況、點擊進來源詳情）">
        <div
          v-for="src in sources"
          :key="src.id"
          class="src"
          @click="$emit('source-click', src.id)"
        >
          <span class="dot" :class="src.status"></span>
          <small>{{ src.id }} {{ src.label }}</small>
        </div>
      </div>
    </template>

    <div class="top-right" :class="{ 'theater-right': theaterMode }">
      <span class="clock" :class="{ 'clock-theater': theaterMode }">{{ clock }}</span>
      <span v-if="!theaterMode" class="account">值班：<b>{{ user?.username ?? '—' }}</b>・{{ roleLabel }}</span>
      <button class="theater-btn" @click="$emit('theater-toggle')">
        {{ theaterMode ? '✕ 退出掛牆' : '🖵 掛牆' }}
      </button>
      <button v-if="!theaterMode" class="menu-btn" @click="$emit('menu-click')">☰ 作業選單</button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSourcesStore } from '../../stores/sources'
import { useAuthStore }    from '../../stores/auth'
import { storeToRefs } from 'pinia'

defineProps({ theaterMode: { type: Boolean, default: false } })
defineEmits(['source-click', 'menu-click', 'theater-toggle'])

const { sources } = storeToRefs(useSourcesStore())
const { user }    = storeToRefs(useAuthStore())

const ROLE_LABELS = { Operator: '營運員', Admin: '管理員', Supervisor: '督導' }
const roleLabel = computed(() => ROLE_LABELS[user.value?.role] ?? user.value?.role ?? '—')

const clock = ref('')
function tick() {
  const d = new Date()
  clock.value = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':')
}
tick()
let timer
onMounted(() => { timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--line);
  position: relative;
  z-index: 30;
  flex-shrink: 0;
  transition: height .25s ease;
}
.topbar.theater {
  height: 40px;
  padding: 0 16px;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
}
.brand b { font-size: 17px; letter-spacing: .06em; }
.brand .mode {
  font-size: 12px;
  color: var(--info);
  border: 1px solid var(--info);
  border-radius: 999px;
  padding: 2px 10px;
  letter-spacing: .1em;
}

.sources { display: flex; gap: 6px; margin: 0 auto; }
.src {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg-base);
  cursor: pointer;
  transition: background .15s;
}
.src:hover { background: var(--bg-panel-raised); }
.src small { font-size: 12px; color: var(--text-secondary); font-family: var(--mono); }

.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.ok     { background: var(--ok); }
.dot.warn   { background: var(--warn); }
.dot.danger { background: var(--danger); animation: breath 1.5s ease-in-out infinite; }

.top-right { display: flex; align-items: center; gap: 16px; white-space: nowrap; }
.theater-right { margin-left: auto; gap: 12px; }

.clock { font-family: var(--mono); font-size: 20px; font-weight: 600; letter-spacing: .05em; }
.clock-theater { font-size: 26px; }

.account { font-size: 13px; color: var(--text-secondary); }
.account b { color: var(--text-primary); font-weight: 500; }

.menu-btn, .theater-btn {
  background: none;
  border: 1px solid var(--line);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--sans);
}
.menu-btn:hover, .theater-btn:hover {
  background: var(--bg-panel-raised);
  color: var(--text-primary);
}

@keyframes breath {
  0%, 100% { opacity: 1; }
  50%       { opacity: .25; }
}
</style>
