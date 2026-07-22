<template>
  <div class="op6-root">
    <OpsTopBar title="系統參數（OP-6）" />

    <div class="content">
      <!-- 4 組參數卡片 -->
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
          @request-save="onRequestSave"
        />
      </InfoCard>
    </div>

    <!--
      單一 ConfirmDialog 處理全部旋鈕的二段確認。
      pendingSave 記錄「哪個 key 要改成什麼值」，
      confirm 事件觸發後才真正寫入 store。
    -->
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
import { useParamsStore, GROUP_META } from '../stores/params'
import { useToastStore }              from '../stores/toast'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import InfoCard     from '../components/shared/InfoCard.vue'
import ParamRow     from '../components/shared/ParamRow.vue'
import ConfirmDialog from '../components/shared/ConfirmDialog.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useParamsStore()
const toast = useToastStore()

// 全系統警語，透過 ConfirmDialog 的 extra prop 顯示
const WARN_EXTRA = '⚠ 此設定將立即生效，影響全系統運作，請謹慎操作。'

// 暫存待確認的修改
// { key: string, oldValue: number, newValue: number, label: string, unit: string }
const pendingSave = ref(null)

const dialog = ref({ open: false, title: '', body: '' })

/**
 * ParamRow 點擊 ✓ 時觸發
 * 這裡只開對話框，不寫入 store
 */
function onRequestSave(key, newValue) {
  const param = store.paramMap[key]
  if (!param) return

  pendingSave.value = {
    key,
    oldValue: param.value,
    newValue,
    label: param.label,
    unit:  param.unit,
  }

  dialog.value = {
    open:  true,
    title: `確認修改「${param.label}」？`,
    body:  `目前值：<b style="font-family:var(--mono)">${param.value.toLocaleString()} ${param.unit}</b>
            &nbsp;→&nbsp;
            新值：<b style="font-family:var(--mono);color:var(--accent)">${newValue.toLocaleString()} ${param.unit}</b>`,
  }
}

/**
 * ConfirmDialog 確認後才真正寫入 store
 * reason 由 ConfirmDialog 的依據選項決定（稽核留跡用）
 */
function onConfirm(reason) {
  if (!pendingSave.value) return
  const { key, newValue, label, unit, oldValue } = pendingSave.value

  store.updateParam(key, newValue, reason)

  dialog.value.open = false
  pendingSave.value = null

  toast.success(
    `已更新「${label}」：${oldValue.toLocaleString()} → ${newValue.toLocaleString()} ${unit}・已留跡`
  )
}

function onCancel() {
  dialog.value.open = false
  // pendingSave 保留，讓使用者可以重新確認；或清空也行
  pendingSave.value = null
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
</style>
