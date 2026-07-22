<!-- 二段確認對話框（操作依據必填）
  Props:
    open:    Boolean
    title:   String
    body:    String (HTML 允許)
    extra:   String — 底部補充說明（狀態機語彙等）
  Emits:
    confirm(reason)
    cancel
-->
<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="$emit('cancel')">
      <div class="dialog">
        <h4>{{ title }}</h4>
        <p v-html="body"></p>

        <div class="reason-group">
          <label class="reason-label">操作依據 <span class="req">*</span></label>
          <div class="reason-options">
            <label v-for="opt in props.reasons" :key="opt.value" class="r-opt">
              <input type="radio" v-model="reason" :value="opt.value" />
              {{ opt.label }}
            </label>
          </div>
          <textarea
            v-if="reason === 'other'"
            v-model="otherText"
            class="other-input"
            placeholder="請說明原因…"
            rows="2"
          ></textarea>
        </div>

        <div v-if="extra" class="extra" v-html="extra"></div>

        <div class="row">
          <button class="btn" @click="$emit('cancel')">取消</button>
          <button
            class="btn primary"
            :disabled="!canSubmit"
            @click="submit"
          >確認</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
const DEFAULT_REASONS = [
  { value: 'internal',   label: '內部查核' },
  { value: 'feedback',   label: '多方反饋' },
  { value: 'correction', label: '來源更正' },
  { value: 'other',      label: '其他' },
]
export { DEFAULT_REASONS }
</script>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open:    { type: Boolean, required: true },
  title:   { type: String,  required: true },
  body:    { type: String,  default: '' },
  extra:   { type: String,  default: '' },
  reasons: { type: Array,   default: () => DEFAULT_REASONS },
})
const emit = defineEmits(['confirm', 'cancel'])

const reason    = ref('')
const otherText = ref('')
const canSubmit = computed(() =>
  reason.value && (reason.value !== 'other' || otherText.value.trim())
)

watch(() => props.open, (val) => {
  if (val) { reason.value = ''; otherText.value = '' }
})

function submit() {
  if (!canSubmit.value) return
  emit('confirm', reason.value === 'other' ? otherText.value.trim() : reason.value)
  reason.value    = ''
  otherText.value = ''
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.dialog {
  width: 400px;
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.45);
  padding: 22px 24px;
  display: grid;
  gap: 14px;
}
h4   { font-size: 16px; }
p    { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

.reason-label { font-size: 13px; color: var(--text-secondary); }
.req { color: var(--danger); }
.reason-options { display: flex; flex-direction: column; gap: 8px; }
.r-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}
.r-opt input { accent-color: var(--accent); }

.other-input {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 8px 12px;
  resize: vertical;
}
.other-input:focus { outline: 1px solid var(--accent); }

.extra {
  border-top: 1px solid var(--line);
  padding-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.row { display: flex; gap: 10px; justify-content: flex-end; }
.btn {
  border-radius: 8px;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-primary);
  padding: 9px 20px;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--sans);
}
.btn:hover { background: var(--bg-panel); }
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #08111F;
  font-weight: 600;
}
.btn.primary:disabled { opacity: .4; cursor: not-allowed; }
.btn.primary:not(:disabled):hover { filter: brightness(1.1); }
</style>
