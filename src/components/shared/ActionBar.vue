<!-- 動作列：主按鈕 slot + 次按鈕 slot + 稽核說明 -->
<template>
  <div class="actions">
    <slot />
    <span class="audit-note">任一動作將寫入稽核日誌（C7）・解除遮罩另記一筆</span>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
}
.audit-note { margin-left: auto; font-size: 12px; color: var(--text-secondary); }

/* 供 slot 內按鈕繼承的全域按鈕樣式（作業模式用） */
:slotted(.btn) {
  border-radius: 8px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 11px 22px;
  font-size: 15px;
  cursor: pointer;
  font-family: var(--sans);
}
:slotted(.btn:hover) { background: var(--bg-panel-raised); }
:slotted(.btn.primary) {
  background: var(--accent);
  border-color: var(--accent);
  color: #08111F;
  font-weight: 600;
}
:slotted(.btn.primary:hover) { filter: brightness(1.1); }
:slotted(.btn.danger)  { color: var(--danger); border-color: var(--danger); }
</style>
