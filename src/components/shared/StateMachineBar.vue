<!-- 狀態機流轉條（§六規格）
  steps: [{ label, state: 'done'|'now'|'pending', lockAfter?: true }]
  suspended: boolean — 整條掛起態（降飽和＋懸浮標籤）
-->
<template>
  <div class="stepper" :class="{ suspended }">
    <span v-if="suspended" class="suspend-tag">掛起（停權）</span>
    <template v-for="(step, i) in steps" :key="i">
      <div class="step" :class="step.state">
        <span class="n">
          <template v-if="step.state === 'done'">✓</template>
          <template v-else>{{ i + 1 }}</template>
        </span>
        {{ step.label }}
      </div>
      <span v-if="i < steps.length - 1" class="step-link" :class="{ lock: step.lockAfter }"></span>
    </template>
  </div>
</template>

<script setup>
defineProps({
  steps:     { type: Array, required: true },
  suspended: { type: Boolean, default: false },
})
</script>

<style scoped>
.stepper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 20px;
}
.stepper.suspended { filter: saturate(0.3); }

.suspend-tag {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--danger);
  border: 1px dashed var(--danger);
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--bg-base);
  white-space: nowrap;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.step .n {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 12px;
  flex-shrink: 0;
}
.step.done {
  color: var(--text-primary);
}
.step.done .n {
  border-color: var(--ok);
  background: rgba(63,183,126,.15);
  color: var(--ok);
}
.step.now {
  color: var(--text-primary);
  font-weight: 600;
}
.step.now .n {
  border-color: var(--accent);
  background: var(--accent);
  color: #08111F;
}

.step-link {
  flex: 1;
  height: 2px;
  background: var(--line);
  margin: 0 10px;
  min-width: 24px;
  position: relative;
}
.step-link.lock::after {
  content: "🔒";
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  filter: grayscale(1);
  opacity: .7;
}
</style>
