<!-- 版型 A 骨架：左佇列（固定 400px）＋右詳情 -->
<template>
  <div class="ops-root">
    <slot name="topbar" />
    <div class="ops-layout">
      <slot name="queue" />
      <slot name="detail" />
    </div>
  </div>
</template>

<style scoped>
.ops-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ops-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  min-height: 0;
}
</style>
