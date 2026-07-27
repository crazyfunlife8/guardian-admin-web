<template>
  <div class="op6-root">
    <OpsTopBar title="系統參數（OP-6）" />

    <div class="content">
      <!-- 參數旋鈕卡片（4 組） -->
      <InfoCard
        v-for="group in GROUP_META"
        :key="group.key"
        :title="group.label"
      >
        <ParamRow
          v-for="p in store.paramsInGroup(group.key)"
          :key="p.key"
          :param-key="p.key"
          :label="p.label"
          :description="p.description"
          :value="p.value"
          :unit="p.unit"
          :type="p.type ?? 'number'"
          @request-save="onRequestSave"
        />
      </InfoCard>

      <!-- 分區任務開關 -->
      <InfoCard title="分區任務開關">
        <div class="region-hint">切換即對該區新事件生效，不影響其他區域；每次變更自動留跡。</div>
        <table class="region-table">
          <thead>
            <tr>
              <th class="col-region">區域</th>
              <th class="col-mode">任務模式</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.regionModes" :key="row.region">
              <td class="col-region">{{ row.region }}</td>
              <td class="col-mode">
                <select
                  class="mode-select"
                  :value="row.mode"
                  @change="onRegionModeChange(row.region, row.mode, $event.target.value)"
                >
                  <option
                    v-for="(label, key) in REGION_MODE_LABELS"
                    :key="key"
                    :value="key"
                  >{{ label }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </InfoCard>
    </div>

    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      :extra="WARN_EXTRA"
      @confirm="onConfirm"
      @cancel="onCancel"
    />

    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useParamsStore, GROUP_META, REGION_MODE_LABELS } from '../stores/params'
import { useToastStore }                                    from '../stores/toast'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import InfoCard     from '../components/shared/InfoCard.vue'
import ParamRow     from '../components/shared/ParamRow.vue'
import ConfirmDialog from '../components/shared/ConfirmDialog.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useParamsStore()
const toast = useToastStore()

const WARN_EXTRA = '⚠ 此設定將立即生效，影響全系統運作，請謹慎操作。'

// pendingChange 可能是旋鈕修改或分區模式切換
// type: 'param' | 'region'
const pendingChange = ref(null)
const dialog        = ref({ open: false, title: '', body: '' })

// ── 旋鈕修改 ──────────────────────────────────────────
function onRequestSave(key, newValue) {
  const param = store.paramMap[key]
  if (!param) return

  const isToggle = param.type === 'toggle'
  pendingChange.value = { type: 'param', key, oldValue: param.value, newValue, label: param.label, unit: param.unit, isToggle }

  dialog.value = {
    open:  true,
    title: isToggle ? `確認切換「${param.label}」？` : `確認修改「${param.label}」？`,
    body:  isToggle
      ? `將「${param.label}」從「${param.value ? '開' : '關'}」切換為「${newValue ? '開' : '關'}」，即刻生效。`
      : `目前值：<b style="font-family:var(--mono)">${param.value.toLocaleString()} ${param.unit}</b>
         &nbsp;→&nbsp;
         新值：<b style="font-family:var(--mono);color:var(--accent)">${Number(newValue).toLocaleString()} ${param.unit}</b>`,
  }
}

// ── 分區模式切換 ──────────────────────────────────────
function onRegionModeChange(region, oldMode, newMode) {
  if (oldMode === newMode) return
  pendingChange.value = { type: 'region', region, oldMode, newMode }

  dialog.value = {
    open:  true,
    title: `確認切換「${region}」任務模式？`,
    body:  `${region}：「${REGION_MODE_LABELS[oldMode]}」&nbsp;→&nbsp;<b style="color:var(--accent)">${REGION_MODE_LABELS[newMode]}</b>`,
  }
}

// ── 確認後執行 ────────────────────────────────────────
function onConfirm(reason) {
  if (!pendingChange.value) return
  const c = pendingChange.value

  if (c.type === 'param') {
    store.updateParam(c.key, c.newValue, reason)
    const { label, unit, oldValue, newValue, isToggle } = c
    toast.success(
      isToggle
        ? `已切換「${label}」：${oldValue ? '開' : '關'} → ${newValue ? '開' : '關'}・已留跡`
        : `已更新「${label}」：${oldValue.toLocaleString()} → ${Number(newValue).toLocaleString()} ${unit}・已留跡`
    )
  } else {
    store.updateRegionMode(c.region, c.newMode, reason)
    toast.success(`已更新「${c.region}」模式：${REGION_MODE_LABELS[c.oldMode]} → ${REGION_MODE_LABELS[c.newMode]}・已留跡`)
  }

  dialog.value.open   = false
  pendingChange.value = null
}

function onCancel() {
  dialog.value.open   = false
  pendingChange.value = null
}
</script>

<style scoped>
.op6-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
}

/* 分區任務開關 */
.region-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.region-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.region-table th {
  text-align: left;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 0 8px;
  border-bottom: 1px solid var(--line);
  font-weight: 500;
}
.region-table td {
  padding: 10px 0;
  border-bottom: 1px solid rgba(42, 53, 71, .3);
}
.region-table tr:last-child td { border-bottom: none; }

.col-region { width: 45%; }
.col-mode   { width: 55%; }

.mode-select {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 5px 10px;
  width: 100%;
  cursor: pointer;
}
.mode-select:focus { outline: 1px solid var(--accent); border-color: var(--accent); }
</style>
