<!--
  ParamRow — C 型設定頁通用旋鈕列
  Props:
    paramKey    String           參數唯一識別碼，emit 時原樣回傳給父層
    label       String           顯示名稱
    description String           說明文字（顯示於標籤下方）
    value       Number           目前生效值（來自 store，響應式）；toggle 型以 0/1 表示關/開
    unit        String           單位文字（分 / 秒 / 元 / 公尺 / 積分:元…）；toggle 型留空
    type        'number'|'toggle' 旋鈕類型，預設 'number'
  Emits:
    request-save(paramKey, newValue)  使用者點 ✓ 或切換後觸發，父層負責 ConfirmDialog 與 store 寫入
-->
<template>
  <div class="param-row">
    <!-- 左側：標籤 + 說明 -->
    <div class="param-info">
      <span class="param-label">{{ label }}</span>
      <span class="param-desc">{{ description }}</span>
    </div>

    <!-- 右側：開關型 -->
    <div v-if="type === 'toggle'" class="param-ctrl">
      <span class="toggle-badge" :class="value ? 'on' : 'off'">{{ value ? '開' : '關' }}</span>
      <button class="edit-btn" @click="requestToggle">切換</button>
    </div>

    <!-- 右側：數值型顯示態 -->
    <div v-else-if="!editing" class="param-ctrl">
      <span class="param-value">{{ value.toLocaleString() }}</span>
      <span class="param-unit">{{ unit }}</span>
      <button class="edit-btn" @click="startEdit">修改</button>
    </div>

    <!-- 右側：數值型編輯態 -->
    <div v-else class="param-ctrl editing">
      <input
        ref="inputRef"
        v-model.number="editValue"
        type="number"
        class="param-input"
        min="0"
        @keyup.enter="requestSave"
        @keyup.escape="cancel"
      />
      <span class="param-unit">{{ unit }}</span>
      <button class="icon-btn ok"     @click="requestSave" title="確認">✓</button>
      <button class="icon-btn cancel" @click="cancel"      title="取消">✗</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  paramKey:    { type: String,  required: true },
  label:       { type: String,  required: true },
  description: { type: String,  default: '' },
  value:       { type: Number,  required: true },
  unit:        { type: String,  default: '' },
  type:        { type: String,  default: 'number' },
})

const emit = defineEmits(['request-save'])

const editing   = ref(false)
const editValue = ref(0)
const inputRef  = ref(null)

function requestToggle() {
  emit('request-save', props.paramKey, props.value ? 0 : 1)
}

async function startEdit() {
  editValue.value = props.value
  editing.value   = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function cancel() {
  editing.value = false
}

function requestSave() {
  const newVal = Number(editValue.value)
  // 防呆：非數字、負數、與原值相同時直接取消
  if (isNaN(newVal) || newVal < 0 || newVal === props.value) {
    cancel()
    return
  }
  editing.value = false
  emit('request-save', props.paramKey, newVal)
}
</script>

<style scoped>
.param-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(42, 53, 71, .4);
}
.param-row:last-child { border-bottom: none; }

/* 左側資訊 */
.param-info {
  flex: 1;
  display: grid;
  gap: 3px;
}
.param-label { font-size: 15px; color: var(--text-primary); }
.param-desc  { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* 右側控制區（顯示態 + 編輯態共用容器） */
.param-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 開關型 */
.toggle-badge {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  padding: 3px 14px;
  border-radius: 999px;
  border: 1px solid;
  min-width: 40px;
  text-align: center;
}
.toggle-badge.on  { color: var(--ok);             border-color: var(--ok);             background: rgba(63,183,126,.1); }
.toggle-badge.off { color: var(--text-secondary);  border-color: var(--line);           background: none; }

/* 顯示態 */
.param-value {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 60px;
  text-align: right;
}
.param-unit {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 50px;
}
.edit-btn {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 5px 12px;
  cursor: pointer;
  transition: color .12s, border-color .12s;
}
.edit-btn:hover { color: var(--accent); border-color: var(--accent); }

/* 編輯態 */
.param-ctrl.editing { gap: 6px; }
.param-input {
  width: 80px;
  background: var(--bg-base);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 15px;
  font-weight: 600;
  padding: 5px 8px;
  text-align: right;
  outline: none;
  /* 隱藏 number spinner */
  -moz-appearance: textfield;
}
.param-input::-webkit-outer-spin-button,
.param-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .12s;
}
.icon-btn.ok     { color: var(--ok);   border-color: var(--ok); }
.icon-btn.ok:hover { background: rgba(63, 183, 126, .1); }
.icon-btn.cancel { color: var(--danger); border-color: var(--danger); }
.icon-btn.cancel:hover { background: rgba(229, 96, 76, .1); }
</style>
