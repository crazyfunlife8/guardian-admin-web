<template>
  <div class="op7-root">
    <OpsTopBar title="反濫用儀表（OP-7）" />

    <!-- 頁籤導航 -->
    <nav class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'queue' }"
        @click="activeTab = 'queue'"
      >
        覆核佇列
        <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'rules' }"
        @click="activeTab = 'rules'"
      >
        規則設定
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'report' }"
        @click="activeTab = 'report'"
      >
        異常報表
      </button>
    </nav>

    <!-- 頁籤內容區 -->
    <div class="tab-content">

      <!-- ① 覆核佇列（版型 A） -->
      <div v-show="activeTab === 'queue'" class="tab-pane queue-pane">
        <QueuePanel
          title="覆核佇列"
          :count="filteredCases.length"
          :filters="QUEUE_FILTERS"
          :active-filter="filterStatus"
          @filter-change="store.setFilter"
        >
          <Op7QueueItem
            v-for="c in filteredCases"
            :key="c.id"
            :item="c"
            :selected="c.id === selectedId"
            @select="store.select"
          />
        </QueuePanel>
        <Op7Detail />
      </div>

      <!-- ② 規則設定（版型 C） -->
      <div v-show="activeTab === 'rules'" class="tab-pane rules-pane">
        <div class="rules-inner">
          <InfoCard title="反濫用規則門檻">
            <ParamRow
              v-for="rule in ruleList"
              :key="rule.key"
              :param-key="rule.key"
              :label="rule.label"
              :description="rule.description"
              :value="rule.value"
              :unit="rule.unit"
              @request-save="onRuleRequestSave"
            />
          </InfoCard>
        </div>
      </div>

      <!-- ③ 配對異常報表（版型 D） -->
      <div v-show="activeTab === 'report'" class="tab-pane report-pane">
        <div class="report-inner">
          <!-- 篩選列 -->
          <div class="filter-bar">
            <select v-model="reportFilter.ruleType" class="filter-select">
              <option value="all">全部類型</option>
              <option value="single_fake">單人作假</option>
              <option value="suspicious_source">可疑來源</option>
            </select>
            <input
              v-model="reportFilter.informantId"
              type="text"
              class="filter-input"
              placeholder="情報員 ID 或來源 ID…"
            />
            <button class="export-btn" @click="exportCsv">匯出 CSV</button>
          </div>

          <!-- 數據表 -->
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>情報員 / 來源</th>
                  <th>觸發類型</th>
                  <th>觸發時間</th>
                  <th>處理結果</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in filteredReports"
                  :key="c.id"
                  class="data-row"
                  @click="goToCase(c.id)"
                >
                  <td class="mono">{{ c.id }}</td>
                  <td class="mono">{{ c.informantId ?? c.sourceId }}</td>
                  <td>
                    <span class="type-chip" :class="c.type">
                      {{ RULE_TYPE_LABELS[c.type] }}
                    </span>
                  </td>
                  <td class="mono">{{ c.triggeredAt }}</td>
                  <td>
                    <StatusBadge
                      :label="STATUS_LABELS[c.status]"
                      :variant="STATUS_VARIANTS[c.status]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredReports.length === 0" class="empty-state">
              無符合條件的記錄
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 規則修改確認對話框（Tab 2 用） -->
    <ConfirmDialog
      :open="ruleDialog.open"
      :title="ruleDialog.title"
      :body="ruleDialog.body"
      :extra="WARN_EXTRA"
      @confirm="onRuleConfirm"
      @cancel="ruleDialog.open = false"
    />

    <Toast />
  </div>
</template>

<script setup>
import { ref }         from 'vue'
import { storeToRefs } from 'pinia'
import { useAbuseCheckStore } from '../stores/abuseCheck'
import { useToastStore }      from '../stores/toast'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import QueuePanel   from '../components/queue/QueuePanel.vue'
import Op7QueueItem from '../components/op7/Op7QueueItem.vue'
import Op7Detail    from '../components/op7/Op7Detail.vue'
import InfoCard     from '../components/shared/InfoCard.vue'
import ParamRow     from '../components/shared/ParamRow.vue'
import StatusBadge  from '../components/shared/StatusBadge.vue'
import ConfirmDialog from '../components/shared/ConfirmDialog.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useAbuseCheckStore()
const toast = useToastStore()

const {
  filteredCases, selectedId, filterStatus, pendingCount,
  filteredReports, reportFilter, ruleList,
} = storeToRefs(store)

const activeTab = ref('queue')

const QUEUE_FILTERS = [
  { label: '待覆核', key: 'pending' },
  { label: '已結案', key: 'closed' },
  { label: '全部',   key: 'all' },
]

const RULE_TYPE_LABELS = {
  single_fake:       '單人作假',
  suspicious_source: '可疑來源',
}
const STATUS_LABELS = {
  pending:   '待覆核',
  confirmed: '確認停權',
  cleared:   '誤判解除',
}
const STATUS_VARIANTS = {
  pending:   'wait',
  confirmed: 'danger',
  cleared:   'ok',
}

// ── Tab ② 規則修改 ──────────────────────────────────────────────
const WARN_EXTRA = '⚠ 規則修改將立即影響系統自動偵測行為，請謹慎操作。'

const pendingRuleSave = ref(null)
const ruleDialog = ref({ open: false, title: '', body: '' })

function onRuleRequestSave(key, newValue) {
  const rule = store.ruleMap[key]
  if (!rule) return
  pendingRuleSave.value = { key, oldValue: rule.value, newValue, label: rule.label, unit: rule.unit }
  ruleDialog.value = {
    open:  true,
    title: `確認修改「${rule.label}」？`,
    body:  `目前值：<b style="font-family:var(--mono)">${rule.value.toLocaleString()} ${rule.unit}</b>
            &nbsp;→&nbsp;
            新值：<b style="font-family:var(--mono);color:var(--accent)">${newValue.toLocaleString()} ${rule.unit}</b>`,
  }
}

function onRuleConfirm(reason) {
  if (!pendingRuleSave.value) return
  const { key, newValue, label, unit, oldValue } = pendingRuleSave.value
  store.updateRule(key, newValue, reason)
  ruleDialog.value.open = false
  pendingRuleSave.value = null
  toast.success(`已更新「${label}」：${oldValue.toLocaleString()} → ${newValue.toLocaleString()} ${unit}・已留跡`)
}

// ── Tab ③ 報表匯出 ──────────────────────────────────────────────
function goToCase(id) {
  store.select(id)
  activeTab.value = 'queue'
}

function exportCsv() {
  const headers = ['案件編號', '情報員/來源', '觸發類型', '觸發時間', '處理結果']
  const rows = filteredReports.value.map(c => [
    c.id,
    c.informantId ?? c.sourceId,
    RULE_TYPE_LABELS[c.type] ?? c.type,
    c.triggeredAt,
    STATUS_LABELS[c.status] ?? c.status,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `反濫用報表_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.op7-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 頁籤列 ── */
.tab-nav {
  display: flex;
  border-bottom: 1px solid var(--line);
  background: var(--bg-panel);
  padding: 0 24px;
  flex-shrink: 0;
}
.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 12px 20px;
  font-size: 14px;
  font-family: var(--sans);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color .15s;
  margin-bottom: -1px;
}
.tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent); }
.tab-btn:hover:not(.active) { color: var(--text-primary); }
.tab-badge {
  font-family: var(--mono);
  font-size: 11px;
  background: var(--warn);
  color: #1A1405;
  border-radius: 999px;
  padding: 1px 7px;
  font-weight: 600;
}

/* ── 頁籤內容容器 ── */
.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.tab-pane {
  position: absolute;
  inset: 0;
}

/* ── Tab ① 覆核佇列（版型 A） ── */
.queue-pane {
  display: grid;
  grid-template-columns: 400px 1fr;
  overflow: hidden;
}

/* ── Tab ② 規則設定（版型 C） ── */
.rules-pane {
  overflow-y: auto;
  display: flex;
  justify-content: center;
}
.rules-inner {
  width: 100%;
  max-width: 760px;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
}

/* ── Tab ③ 異常報表（版型 D） ── */
.report-pane {
  overflow-y: auto;
}
.report-inner {
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
}

/* 篩選列 */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-select {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 7px 12px;
  cursor: pointer;
}
.filter-input {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 14px;
  padding: 7px 12px;
  width: 200px;
}
.filter-input:focus { outline: 1px solid var(--accent); }
.filter-input::placeholder { color: var(--text-secondary); font-family: var(--sans); }
.export-btn {
  margin-left: auto;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: none;
  color: var(--accent);
  font-size: 13px;
  font-family: var(--sans);
  padding: 0 14px;
  height: 32px;
  cursor: pointer;
  transition: background .12s;
}
.export-btn:hover { background: rgba(76,154,255,.1); }

/* 數據表 */
.table-wrap { overflow-x: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  text-align: left;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13px;
  padding: 8px 16px 8px 0;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.data-table td {
  padding: 12px 16px 12px 0;
  border-bottom: 1px solid rgba(42,53,71,.3);
  color: var(--text-primary);
  vertical-align: middle;
}
.data-table thead th:last-child,
.data-table tbody td:last-child { padding-right: 0; }

.data-row { cursor: pointer; transition: background .12s; }
.data-row:hover { background: var(--bg-panel-raised); }
.data-row:hover .data-table td { border-bottom-color: transparent; }

.mono { font-family: var(--mono); }

.type-chip {
  font-size: 12px;
  border-radius: 4px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
}
.type-chip.single_fake       { color: var(--warn);   border-color: var(--warn); }
.type-chip.suspicious_source { color: var(--danger); border-color: var(--danger); }

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
