<!-- 時間軸（§六規格）
  entries: [{ time, actor, text, done?: true }]
-->
<template>
  <div class="timeline">
    <h3 v-if="title">{{ title }}</h3>
    <div class="tl">
      <div
        v-for="(e, i) in entries"
        :key="i"
        :class="{ done: e.done }"
      >
        <time>{{ e.time }}</time>
        {{ e.text }}
        <span v-if="e.actor" class="who">・{{ e.actor }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:   { type: String, default: '' },
  entries: { type: Array, required: true },
})
</script>

<style scoped>
.timeline {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
}
h3 {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 12px;
}
.tl {
  border-left: 2px solid var(--line);
  margin-left: 6px;
  padding-left: 16px;
  display: grid;
  gap: 12px;
  font-size: 14px;
}
.tl div {
  position: relative;
}
.tl div::before {
  content: "";
  position: absolute;
  left: -21px;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--line);
}
.tl div.done::before { background: var(--ok); }
time { font-family: var(--mono); color: var(--text-secondary); margin-right: 10px; font-size: 13px; }
.who { color: var(--text-secondary); }
</style>
