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
          <span class="filter-label">服務區域</span>
          <select v-model="zoneFilter" class="filter-select">
            <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
          </select>
          <button class="clear-btn" @click="zoneFilter = '全部'">清除</button>
          <button class="export-btn" @click="exportSupplyCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">共 <b>{{ filteredSupplyRows.length }}</b> 位情報員</div>

        <div v-if="supplyChart.bars.length" class="chart-section">
          <div class="chart-title">本月接單量排行</div>
          <svg :viewBox="`0 0 600 ${supplyChart.svgH}`" class="bar-chart-svg">
            <line x1="95" x2="95" y1="5" :y2="supplyChart.svgH - 5" class="axis-line" />
            <g v-for="bar in supplyChart.bars" :key="bar.id">
              <text :x="90" :y="bar.y + supplyChart.bh * 0.7"
                class="bar-label" text-anchor="end">{{ bar.id }}</text>
              <rect :x="95" :y="bar.y" :width="Math.max(bar.w, 2)"
                :height="supplyChart.bh" class="bar-rect" rx="3" />
              <text :x="95 + Math.max(bar.w, 2) + 6" :y="bar.y + supplyChart.bh * 0.7"
                class="bar-value">{{ bar.v }}</text>
            </g>
          </svg>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>情報員 ID</th><th>服務區域</th><th class="right">本月接單</th>
                <th class="right">完成率</th><th class="right">正確率</th><th class="right">積分入帳</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredSupplyRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.informantId }}</td>
                <td>{{ row.zone }}</td>
                <td class="mono right">{{ row.monthlyCount }}</td>
                <td class="mono right" :class="rateColor(row.completionRate)">{{ row.completionRate }}%</td>
                <td class="mono right" :class="rateColor(row.accuracyRate)">{{ row.accuracyRate }}%</td>
                <td class="mono right accent">{{ row.pointsEarned.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredSupplyRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
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
          共 <b>{{ filteredPayoutRows.length }}</b> 位情報員・
          年度總入帳 <b class="accent">{{ totalPayout.toLocaleString() }}</b> 積分
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>情報員 ID</th><th>服務區域</th><th class="right">年度接單</th>
                <th class="right">年度積分入帳</th><th class="right">兌換次數</th><th class="right">年度兌換積分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredPayoutRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.informantId }}</td>
                <td>{{ row.zone }}</td>
                <td class="mono right">{{ row.yearlyCount }}</td>
                <td class="mono right accent">{{ row.totalEarned.toLocaleString() }}</td>
                <td class="mono right">{{ row.redeemedCount }}</td>
                <td class="mono right">{{ row.totalRedeemed.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredPayoutRows.length" class="empty-state">無符合條件的記錄</div>
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
import { ref, computed } from 'vue'
import { useReportsStore, ZONES } from '../stores/reports'
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
const zoneFilter = ref('全部')

const filteredSupplyRows = computed(() => {
  const rows = reportsStore.informantRows
  if (zoneFilter.value === '全部') return rows
  return rows.filter(r => r.zone === zoneFilter.value)
})

function makeBarChart(rows, vKey) {
  const BH = 22, GAP = 7, Y0 = 12, X0 = 95, X1 = 560
  if (!rows.length) return { bars: [], svgH: 50, bh: BH }
  const maxV = Math.max(...rows.map(r => r[vKey])) || 1
  const bars = rows.map((r, i) => ({
    y:  Y0 + i * (BH + GAP),
    w:  (r[vKey] / maxV) * (X1 - X0),
    id: r.informantId,
    v:  r[vKey],
  }))
  return { bars, svgH: Y0 + rows.length * (BH + GAP) + 10, bh: BH }
}

const supplyChart = computed(() => makeBarChart(filteredSupplyRows.value, 'monthlyCount'))

function exportSupplyCSV() {
  downloadCSV(filteredSupplyRows.value, [
    { h: '情報員ID', k: 'informantId' }, { h: '服務區域', k: 'zone' },
    { h: '本月接單', k: 'monthlyCount' }, { h: '完成率%', k: 'completionRate' },
    { h: '正確率%', k: 'accuracyRate' }, { h: '積分入帳', k: 'pointsEarned' },
  ], '供給側報表.csv')
}

// ── ② 年度給付彙整（C8）──────────────────────────────────
const PAYOUT_YEARS = [2025, 2024]
const payoutYear   = ref(2025)

const filteredPayoutRows = computed(() =>
  reportsStore.annualPayoutRows.filter(r => r.year === payoutYear.value)
)

const totalPayout = computed(() =>
  filteredPayoutRows.value.reduce((s, r) => s + r.totalEarned, 0)
)

function exportPayoutCSV() {
  downloadCSV(filteredPayoutRows.value, [
    { h: '情報員ID', k: 'informantId' }, { h: '服務區域', k: 'zone' }, { h: '年度', k: 'year' },
    { h: '年度接單', k: 'yearlyCount' }, { h: '年度積分入帳', k: 'totalEarned' },
    { h: '兌換次數', k: 'redeemedCount' }, { h: '年度兌換積分', k: 'totalRedeemed' },
  ], `年度給付彙整_${payoutYear.value}.csv`)
}

// ── 共用工具 ───────────────────────────────────────────────
function rateColor(v) {
  if (v >= 85) return 'col-ok'
  if (v >= 70) return 'col-warn'
  return 'col-danger'
}

function downloadCSV(rows, cols, filename) {
  const header = cols.map(c => c.h).join(',')
  const body   = rows.map(r => cols.map(c => r[c.k] ?? '').join(',')).join('\n')
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
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
.id-input { font-family: var(--sans); width: 160px; }

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

/* 條形圖 */
.chart-section {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px 10px;
}
.chart-title    { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.bar-chart-svg  { width: 100%; display: block; }

/* SVG 固定色（避免 CSS var 在 SVG attr 的相容問題） */
.axis-line { stroke: rgba(255,255,255,.12); stroke-width: 1; }
.bar-rect  { fill: rgba(76,154,255,.3); }
.bar-label { font-family: monospace; font-size: 11px; fill: #8899AA; }
.bar-value { font-family: monospace; font-size: 11px; fill: #AABBCC; }

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
