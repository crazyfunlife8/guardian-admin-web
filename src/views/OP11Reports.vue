<template>
  <div class="op11-root">
    <OpsTopBar title="報表中心（OP-11）" />

    <!-- 頁籤列 -->
    <nav class="tab-nav">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </nav>

    <div class="page-body">

      <!-- ① 供給側報表（O-11）────────────────────────────────── -->
      <div v-show="activeTab === 'supply'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">期間</span>
          <input v-model="supplyFrom" type="date" class="filter-input date-input" />
          <span class="filter-label">—</span>
          <input v-model="supplyTo" type="date" class="filter-input date-input" />
          <button class="clear-btn" @click="reloadSupply">查詢</button>
          <button class="export-btn" @click="exportSupplyCSV">↓ 匯出 CSV</button>
        </div>

        <template v-if="supply">
          <div class="summary-row">
            查詢區間：<b>{{ supply.fromUtc?.slice(0, 10) }}</b> — <b>{{ supply.toUtc?.slice(0, 10) }}</b>
          </div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-val mono">{{ supply.activeInformants }}</div>
              <div class="kpi-label">活躍情報員</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono">{{ supply.tasksCreated }}</div>
              <div class="kpi-label">建立任務數</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono">{{ supply.tasksAccepted }}</div>
              <div class="kpi-label">接單任務數</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono" :class="rateColor((supply.acceptanceRate ?? 0) * 100)">
                {{ ((supply.acceptanceRate ?? 0) * 100).toFixed(1) }}%
              </div>
              <div class="kpi-label">接受率</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono">{{ (supply.avgVerificationLatencyMinutes ?? 0).toFixed(1) }} min</div>
              <div class="kpi-label">平均核驗延遲</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono accent">{{ (supply.creditTotal ?? 0).toLocaleString() }}</div>
              <div class="kpi-label">期間積分發放</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono">{{ supply.verifiedEventCount }}</div>
              <div class="kpi-label">已核驗事件數</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val mono">{{ (supply.costPerIntel ?? 0).toFixed(1) }}</div>
              <div class="kpi-label">每件情報成本（積分）</div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">請選擇期間後按查詢</div>
      </div>

      <!-- ② 年度給付彙整（C8）────────────────────────────────── -->
      <div v-show="activeTab === 'payout'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">年度</span>
          <select v-model="payoutYear" class="filter-select">
            <option v-for="y in PAYOUT_YEARS" :key="y" :value="y">{{ y }} 年</option>
          </select>
          <button class="export-btn" @click="exportPayoutCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">
          共 <b>{{ reportsStore.annualPayoutRows.length }}</b> 位情報員・
          年度總積分 <b class="accent">{{ totalPayout.toLocaleString() }}</b> 積分
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>情報員編號</th><th>情報員 ID</th>
                <th class="right">年度積分合計</th><th class="right">年度接單數</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in reportsStore.annualPayoutRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.informantNo }}</td>
                <td class="mono">{{ row.informantId }}</td>
                <td class="mono right accent">{{ row.totalPoints.toLocaleString() }}</td>
                <td class="mono right">{{ row.orderCount }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!reportsStore.annualPayoutRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
      </div>

      <!-- ③ 機率層事後比對（D3）──────────────────────────────── -->
      <div v-show="activeTab === 'prob'" class="tab-pane">
        <div class="prob-empty">
          <div class="prob-icon">📊</div>
          <div class="prob-title">資料累積中</div>
          <div class="prob-desc">機率層事後比對功能將於上線三個月後開放，用於驗證機率層預測準度（D3）。</div>
        </div>
      </div>

    </div><!-- /page-body -->

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useReportsStore } from '../stores/reports'
import OpsTopBar from '../components/layout/OpsTopBar.vue'
import Toast     from '../components/shared/Toast.vue'

const reportsStore = useReportsStore()

const TABS = [
  { key: 'supply', label: '供給側報表' },
  { key: 'payout', label: '年度給付彙整' },
  { key: 'prob',   label: '機率層事後比對' },
]
const activeTab = ref('supply')

// ── ① 供給側報表（O-11）──────────────────────────────────
// SupplyReportItem 是聚合統計物件，不是逐情報員列表
const today         = new Date().toISOString().slice(0, 10)
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
const supplyFrom    = ref(thirtyDaysAgo)
const supplyTo      = ref(today)

const supply = computed(() => reportsStore.supplyReport)

function reloadSupply() {
  reportsStore.loadSupplyReport(supplyFrom.value, supplyTo.value)
}

function exportSupplyCSV() {
  const s = supply.value
  if (!s) return
  const rows = [[
    s.fromUtc?.slice(0, 10) ?? '', s.toUtc?.slice(0, 10) ?? '',
    s.activeInformants, s.tasksCreated, s.tasksAccepted,
    ((s.acceptanceRate ?? 0) * 100).toFixed(1),
    (s.avgVerificationLatencyMinutes ?? 0).toFixed(1),
    s.creditTotal, s.verifiedEventCount,
    (s.costPerIntel ?? 0).toFixed(1),
  ]]
  const header = '期間起,期間迄,活躍情報員,建立任務,接單任務,接受率%,平均核驗延遲min,積分發放,核驗事件,每件成本'
  const body   = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `供給側報表_${today}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── ② 年度給付彙整（C8）──────────────────────────────────
// AnnualPayoutItem: { informantId, informantNo, totalPoints, orderCount }
const PAYOUT_YEARS = [new Date().getFullYear(), new Date().getFullYear() - 1]
const payoutYear   = ref(new Date().getFullYear())

const totalPayout = computed(() =>
  reportsStore.annualPayoutRows.reduce((s, r) => s + (r.totalPoints ?? 0), 0)
)

watch(payoutYear, y => reportsStore.loadAnnualPayout(y))

function exportPayoutCSV() {
  reportsStore.downloadAnnualPayoutCsv(payoutYear.value)
}

// ── 共用工具 ───────────────────────────────────────────────
function rateColor(v) {
  if (v >= 85) return 'col-ok'
  if (v >= 70) return 'col-warn'
  return 'col-danger'
}

onMounted(() => {
  reloadSupply()
  reportsStore.loadAnnualPayout(payoutYear.value)
})
</script>

<style scoped>
.op11-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 頁籤列 */
.tab-nav {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-panel);
  flex-shrink: 0;
}
.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--sans);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  transition: color .12s, border-color .12s;
}
.tab-btn:hover  { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

/* 頁面主體 */
.page-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.tab-pane {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 20px 32px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 篩選列 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-label { font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.filter-sep   { font-size: 13px; color: var(--text-secondary); }

.filter-input {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 13px;
  padding: 5px 10px;
  height: 32px;
  outline: none;
  transition: border-color .12s;
}
.filter-input:focus { border-color: var(--accent); }
.id-input   { font-family: var(--sans); width: 160px; }
.date-input { width: 140px; }
.date-input::-webkit-calendar-picker-indicator { filter: invert(.5); cursor: pointer; }

.filter-select {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 5px 10px;
  height: 32px;
  outline: none;
  cursor: pointer;
}

.clear-btn {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 0 12px;
  height: 32px;
  cursor: pointer;
  transition: color .12s;
}
.clear-btn:hover { color: var(--text-primary); }

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

/* 摘要列 */
.summary-row   { font-size: 13px; color: var(--text-secondary); }
.summary-row b { color: var(--text-primary); }
.summary-row b.accent { color: var(--accent); }

/* KPI 卡片格 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.kpi-card {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kpi-val   { font-family: var(--mono); font-size: 22px; font-weight: 600; color: var(--text-primary); }
.kpi-label { font-size: 12px; color: var(--text-secondary); }

/* 資料表 */
.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--line);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead th {
  background: var(--bg-panel-raised);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.data-table thead th.right { text-align: right; }
.data-table tbody tr       { border-bottom: 1px solid rgba(42,53,71,.3); }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr.odd   { background: rgba(255,255,255,.015); }
.data-table tbody tr:hover { background: rgba(76,154,255,.04); }
.data-table td { padding: 9px 14px; color: var(--text-primary); white-space: nowrap; }
.mono   { font-family: var(--mono); }
.right  { text-align: right; }
.accent { color: var(--accent); }

/* 數值著色 */
.col-ok     { color: var(--ok); }
.col-warn   { color: var(--warn); }
.col-danger { color: var(--danger); }

/* 機率層事後比對：空態 */
.prob-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--text-secondary);
}
.prob-icon  { font-size: 36px; opacity: .4; }
.prob-title { font-size: 16px; font-weight: 500; color: var(--text-primary); }
.prob-desc  { font-size: 13px; text-align: center; max-width: 340px; line-height: 1.7; }

/* 空態 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
