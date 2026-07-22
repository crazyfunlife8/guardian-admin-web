<!-- Toast 通知（右下、4s 自動消失；失敗不自消）
  透過 useToastStore 觸發
-->
<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
        >
          <span class="bar"></span>
          <span class="msg">{{ t.message }}</span>
          <button v-if="t.type === 'error'" class="close" @click="remove(t.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../../stores/toast'
import { storeToRefs } from 'pinia'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
const { remove } = toastStore
</script>

<style scoped>
.toast-stack {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 200;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 260px;
  max-width: 380px;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
}
.bar {
  width: 3px;
  align-self: stretch;
  border-radius: 2px;
  flex-shrink: 0;
}
.toast.success .bar { background: var(--ok); }
.toast.error   .bar { background: var(--danger); }
.toast.info    .bar { background: var(--info); }

.msg  { flex: 1; }
.close { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 13px; }

.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { transform: translateX(40px); opacity: 0; }
.toast-leave-to   { transform: translateX(40px); opacity: 0; }
</style>
