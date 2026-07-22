<!--
  作業選單抽屜 — 從右側滑入
  Props:  open  Boolean
  Emits:  close
-->
<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click="$emit('close')" />

    <aside class="ops-menu" :class="{ open }">
      <div class="menu-head">
        <h2>作業選單</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <nav class="menu-body">
        <button
          v-for="item in MENU_ITEMS"
          :key="item.route"
          class="menu-item"
          :class="{ disabled: !item.built, active: route.path === item.route }"
          :disabled="!item.built"
          @click="navigate(item)"
        >
          <span class="op-chip">{{ item.op }}</span>
          <span class="item-label">{{ item.label }}</span>
          <span v-if="item.restricted" class="tag restrict">高權限</span>
          <span v-if="!item.built" class="tag wip">建構中</span>
        </button>
      </nav>

      <div class="menu-foot">
        <span>共 {{ builtCount }} / {{ MENU_ITEMS.length }} 頁已完成</span>
      </div>
    </aside>
  </Teleport>
</template>

<script setup>
import { computed }            from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineProps({ open: { type: Boolean, required: true } })
defineEmits(['close'])

const router = useRouter()
const route  = useRoute()

const MENU_ITEMS = [
  { op: 'OP-6',  label: '系統參數',           route: '/op6',  built: true,  restricted: false },
  { op: 'OP-7',  label: '反濫用儀表',         route: '/op7',  built: true,  restricted: false },
  { op: 'OP-9',  label: '帳本管理',           route: '/op9',  built: true,  restricted: false },
  { op: 'OP-10', label: '靜態資料管理',       route: '/op10', built: true,  restricted: false },
  { op: 'OP-11', label: '報表中心',           route: '/op11', built: true,  restricted: false },
  { op: 'OP-12', label: '帳號權限與操作日誌', route: '/op12', built: true,  restricted: true  },
  { op: 'OP-13', label: '客服工單',           route: '/op13', built: true,  restricted: false },
]

const builtCount = computed(() => MENU_ITEMS.filter(i => i.built).length)

function navigate(item) {
  if (!item.built) return
  router.push(item.route)
  // 觸發 close 由父層監聽
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  z-index: 49;
}

.ops-menu {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 280px;
  background: var(--bg-panel-raised);
  border-left: 1px solid var(--line);
  box-shadow: -8px 0 24px rgba(0, 0, 0, .4);
  z-index: 50;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform .22s cubic-bezier(.4, 0, .2, 1);
}
.ops-menu.open { transform: translateX(0); }

/* 頭部 */
.menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.menu-head h2 { font-size: 17px; font-weight: 600; }
.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color .12s, background .12s;
}
.close-btn:hover { color: var(--text-primary); background: var(--bg-panel); }

/* 選單主體 */
.menu-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: var(--sans);
  transition: background .12s;
}
.menu-item:hover:not(.disabled) { background: var(--bg-panel); }
.menu-item.active { background: rgba(76, 154, 255, .1); }
.menu-item.disabled { cursor: not-allowed; opacity: .45; }

.op-chip {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 2px 6px;
  color: var(--text-secondary);
  flex-shrink: 0;
  min-width: 42px;
  text-align: center;
}
.menu-item.active .op-chip {
  border-color: var(--accent);
  color: var(--accent);
}

.item-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}
.menu-item.disabled .item-label { color: var(--text-secondary); }

.tag {
  font-size: 10px;
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
}
.tag.wip      { background: rgba(255,255,255,.06); color: var(--text-secondary); border: 1px solid var(--line); }
.tag.restrict { background: rgba(229, 96, 76, .12); color: var(--danger); border: 1px solid var(--danger); }

/* 頁尾 */
.menu-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
