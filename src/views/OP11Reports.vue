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

      <!-- ① 事件報表 ───────────────────────────────────────── -->
      <div v-show="activeTab === 'event'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">日期</span>
          <input v-model="dateFrom" type="date" class="filter-input" />
          <span class="filter-sep">至</span>
          <input v-model="dateTo" type="date" class="filter-input" />
          <span class="filter-label">事件類型</span>
          <select v-model="eventTypeFilter" class="filter-select">
            <option v-for="t in EVENT_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
          <button class="clear-btn" @click="clearAll">清除</button>
          <button class="export-btn" @click="exportEventCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">共 <b>{{ filteredEventRows.length }}</b> 筆記錄</div>

        <div v-if="eventChart" class="chart-section">
          <div class="chart-title">確認率趨勢（%）</div>
          <svg viewBox="0 0 600 175" class="chart-svg">
            <line v-for="yl in eventChart.yLabels" :key="yl.v"
              x1="55" x2="582" :y1="yl.y" :y2="yl.y" class="grid-line" />
            <text v-for="yl in eventChart.yLabels" :key="'y'+yl.v"
              x="50" :y="yl.y + 4" class="axis-text" text-anchor="end">{{ yl.v }}</text>
            <polygon :points="`55,145 ${eventChart.line} 582,145`" class="area-fill" />
            <polyline :points="eventChart.line" class="data-line" />
            <circle v-for="(pt, i) in eventChart.pts" :key="i"
              :cx="pt.x.toFixed(1)" :cy="pt.y.toFixed(1)" r="3" class="data-dot" />
            <text v-for="xl in eventChart.xDates" :key="xl.label"
              :x="xl.x.toFixed(1)" y="165" class="axis-text" text-anchor="middle">{{ xl.label }}</text>
          </svg>
        </div>
        <div v-else class="chart-empty">篩選後資料不足兩筆，無法顯示趨勢圖</div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th><th>事件類型</th><th>來源</th>
                <th class="right">確認率</th><th class="right">平均 TTL</th><th class="right">上架數</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredEventRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.date }}</td>
                <td><span class="type-chip" :class="EVENT_CHIP[row.type]">{{ row.type }}</span></td>
                <td>{{ row.source }}</td>
                <td class="mono right" :class="rateColor(row.confirmRate)">{{ row.confirmRate }}%</td>
                <td class="mono right">{{ row.avgTtlMin }} 分</td>
                <td class="mono right">{{ row.count }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredEventRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
      </div>

      <!-- ② 任務報表 ───────────────────────────────────────── -->
      <div v-show="activeTab === 'task'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">日期</span>
          <input v-model="dateFrom" type="date" class="filter-input" />
          <span class="filter-sep">至</span>
          <input v-model="dateTo" type="date" class="filter-input" />
          <button class="clear-btn" @click="clearAll">清除</button>
          <button class="export-btn" @click="exportTaskCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">共 <b>{{ filteredTaskRows.length }}</b> 筆記錄</div>

        <div v-if="taskChart" class="chart-section">
          <div class="chart-title">接單率趨勢（%）</div>
          <svg viewBox="0 0 600 175" class="chart-svg">
            <line v-for="yl in taskChart.yLabels" :key="yl.v"
              x1="55" x2="582" :y1="yl.y" :y2="yl.y" class="grid-line" />
            <text v-for="yl in taskChart.yLabels" :key="'y'+yl.v"
              x="50" :y="yl.y + 4" class="axis-text" text-anchor="end">{{ yl.v }}</text>
            <polygon :points="`55,145 ${taskChart.line} 582,145`" class="area-fill" />
            <polyline :points="taskChart.line" class="data-line" />
            <circle v-for="(pt, i) in taskChart.pts" :key="i"
              :cx="pt.x.toFixed(1)" :cy="pt.y.toFixed(1)" r="3" class="data-dot" />
            <text v-for="xl in taskChart.xDates" :key="xl.label"
              :x="xl.x.toFixed(1)" y="165" class="axis-text" text-anchor="middle">{{ xl.label }}</text>
          </svg>
        </div>
        <div v-else class="chart-empty">篩選後資料不足兩筆，無法顯示趨勢圖</div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th><th class="right">廣播數</th><th class="right">接單率</th>
                <th class="right">平均接單秒</th><th class="right">逾時率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredTaskRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.date }}</td>
                <td class="mono right">{{ row.broadcastCount }}</td>
                <td class="mono right" :class="rateColor(row.acceptanceRate)">{{ row.acceptanceRate }}%</td>
                <td class="mono right">{{ row.avgResponseSec }} 秒</td>
                <td class="mono right" :class="rateColor(100 - row.timeoutRate)">{{ row.timeoutRate }}%</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredTaskRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
      </div>

      <!-- ③ 情報員報表 ─────────────────────────────────────── -->
      <div v-show="activeTab === 'informant'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">服務區域</span>
          <select v-model="zoneFilter" class="filter-select">
            <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
          </select>
          <button class="clear-btn" @click="zoneFilter = '全部'">清除</button>
          <button class="export-btn" @click="exportInfCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">共 <b>{{ filteredInformantRows.length }}</b> 位情報員</div>

        <div v-if="informantChart.bars.length" class="chart-section">
          <div class="chart-title">本月接單量排行</div>
          <svg :viewBox="`0 0 600 ${informantChart.svgH}`" class="bar-chart-svg">
            <line x1="95" x2="95" y1="5" :y2="informantChart.svgH - 5" class="axis-line" />
            <g v-for="bar in informantChart.bars" :key="bar.id">
              <text :x="90" :y="bar.y + informantChart.bh * 0.7"
                class="bar-label" text-anchor="end">{{ bar.id }}</text>
              <rect :x="95" :y="bar.y" :width="Math.max(bar.w, 2)"
                :height="informantChart.bh" class="bar-rect" rx="3" />
              <text :x="95 + Math.max(bar.w, 2) + 6" :y="bar.y + informantChart.bh * 0.7"
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
              <tr v-for="(row, i) in filteredInformantRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.informantId }}</td>
                <td>{{ row.zone }}</td>
                <td class="mono right">{{ row.monthlyCount }}</td>
                <td class="mono right" :class="rateColor(row.completionRate)">{{ row.completionRate }}%</td>
                <td class="mono right" :class="rateColor(row.accuracyRate)">{{ row.accuracyRate }}%</td>
                <td class="mono right accent">{{ row.pointsEarned.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredInformantRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
      </div>

      <!-- ④ 用戶反饋報表 ──────────────────────────────────── -->
      <div v-show="activeTab === 'feedback'" class="tab-pane">
        <div class="filter-bar">
          <span class="filter-label">日期</span>
          <input v-model="dateFrom" type="date" class="filter-input" />
          <span class="filter-sep">至</span>
          <input v-model="dateTo" type="date" class="filter-input" />
          <button class="clear-btn" @click="clearAll">清除</button>
          <button class="export-btn" @click="exportFbCSV">↓ 匯出 CSV</button>
        </div>

        <div class="summary-row">共 <b>{{ filteredFeedbackRows.length }}</b> 筆記錄</div>

        <div v-if="feedbackChart" class="chart-section">
          <div class="chart-title">每日回報數趨勢</div>
          <svg viewBox="0 0 600 175" class="chart-svg">
            <line v-for="yl in feedbackChart.yLabels" :key="yl.v"
              x1="55" x2="582" :y1="yl.y" :y2="yl.y" class="grid-line" />
            <text v-for="yl in feedbackChart.yLabels" :key="'y'+yl.v"
              x="50" :y="yl.y + 4" class="axis-text" text-anchor="end">{{ yl.v }}</text>
            <polygon :points="`55,145 ${feedbackChart.line} 582,145`" class="area-fill" />
            <polyline :points="feedbackChart.line" class="data-line" />
            <circle v-for="(pt, i) in feedbackChart.pts" :key="i"
              :cx="pt.x.toFixed(1)" :cy="pt.y.toFixed(1)" r="3" class="data-dot" />
            <text v-for="xl in feedbackChart.xDates" :key="xl.label"
              :x="xl.x.toFixed(1)" y="165" class="axis-text" text-anchor="middle">{{ xl.label }}</text>
          </svg>
        </div>
        <div v-else class="chart-empty">篩選後資料不足兩筆，無法顯示趨勢圖</div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th><th class="right">回報數</th>
                <th class="right">誤報率</th><th class="right">一鍵確認率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredFeedbackRows" :key="i" :class="{ odd: i % 2 === 1 }">
                <td class="mono">{{ row.date }}</td>
                <td class="mono right">{{ row.reportCount }}</td>
                <td class="mono right" :class="rateColor(100 - row.falseReportRate)">{{ row.falseReportRate }}%</td>
                <td class="mono right" :class="rateColor(row.oneClickRate)">{{ row.oneClickRate }}%</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredFeedbackRows.length" class="empty-state">無符合條件的記錄</div>
        </div>
      </div>

    </div><!-- /page-body -->

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useReportsStore, EVENT_TYPES, ZONES } from '../stores/reports'
import OpsTopBar from '../components/layout/OpsTopBar.vue'
import Toast     from '../components/shared/Toast.vue'

const store = useReportsStore()

const TABS = [
  { key: 'event',     label: '事件報表' },
  { key: 'task',      label: '任務報表' },
  { key: 'informant', label: '情報員報表' },
  { key: 'feedback',  label: '用戶反饋報表' },
]
const activeTab = ref('event')

// ── 篩選 state ────────────────────────────────────────────
const dateFrom        = ref('')
const dateTo          = ref('')
const eventTypeFilter = ref('全部')
const zoneFilter      = ref('全部')

function clearAll() {
  dateFrom.value        = ''
  dateTo.value          = ''
  eventTypeFilter.value = '全部'
  zoneFilter.value      = '全部'
}

// ── 篩選後資料 ─────────────────────────────────────────────
const filteredEventRows = computed(() => {
  let rows = store.eventRows
  if (dateFrom.value)                   rows = rows.filter(r => r.date >= dateFrom.value)
  if (dateTo.value)                     rows = rows.filter(r => r.date <= dateTo.value)
  if (eventTypeFilter.value !== '全部') rows = rows.filter(r => r.type === eventTypeFilter.value)
  return rows
})

const filteredTaskRows = computed(() => {
  let rows = store.taskRows
  if (dateFrom.value) rows = rows.filter(r => r.date >= dateFrom.value)
  if (dateTo.value)   rows = rows.filter(r => r.date <= dateTo.value)
  return rows
})

const filteredInformantRows = computed(() => {
  let rows = store.informantRows
  if (zoneFilter.value !== '全部') rows = rows.filter(r => r.zone === zoneFilter.value)
  return rows
})

const filteredFeedbackRows = computed(() => {
  let rows = store.feedbackRows
  if (dateFrom.value) rows = rows.filter(r => r.date >= dateFrom.value)
  if (dateTo.value)   rows = rows.filter(r => r.date <= dateTo.value)
  return rows
})

// ── SVG 折線圖計算 ─────────────────────────────────────────
const CX0 = 55, CX1 = 582, CY0 = 12, CY1 = 145

function makeLineChart(rows, vKey) {
  if (rows.length < 2) return null
  const vals = rows.map(r => r[vKey])
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const span = maxV === minV ? 1 : maxV - minV
  const W = CX1 - CX0, H = CY1 - CY0
  const n = rows.length

  const pts = rows.map((r, i) => ({
    x: CX0 + (i / (n - 1)) * W,
    y: CY1 - ((r[vKey] - minV) / span) * H,
    v: r[vKey],
  }))

  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const step = Math.max(1, Math.floor(n / 5))
  const xIdxSet = new Set()
  for (let i = 0; i < n; i += step) xIdxSet.add(i)
  xIdxSet.add(n - 1)
  const xDates = [...xIdxSet].map(i => ({
    x: pts[i].x,
    label: rows[i].date ? rows[i].date.slice(5) : '',
  }))

  return {
    pts,
    line,
    yLabels: [
      { y: CY0,              v: maxV },
      { y: (CY0 + CY1) / 2, v: Math.round((minV + maxV) / 2) },
      { y: CY1,              v: minV },
    ],
    xDates,
  }
}

const eventChart    = computed(() => makeLineChart(filteredEventRows.value, 'confirmRate'))
const taskChart     = computed(() => makeLineChart(filteredTaskRows.value, 'acceptanceRate'))
const feedbackChart = computed(() => makeLineChart(filteredFeedbackRows.value, 'reportCount'))

// ── SVG 橫條圖計算（情報員報表）───────────────────────────
function makeBarChart(rows, vKey) {
  const BH = 22, GAP = 7, Y0 = 12, X0 = 95, X1 = 560
  if (!rows.length) return { bars: [], svgH: 50, bh: BH }
  const maxV = Math.max(...rows.map(r => r[vKey])) || 1
  const bars = rows.map((r, i) => ({
    y: Y0 + i * (BH + GAP),
    w: (r[vKey] / maxV) * (X1 - X0),
    id: r.informantId,
    v: r[vKey],
  }))
  return { bars, svgH: Y0 + rows.length * (BH + GAP) + 10, bh: BH }
}

const informantChart = computed(() => makeBarChart(filteredInformantRows.value, 'monthlyCount'))

// ── 輔助：數值著色 ─────────────────────────────────────────
const EVENT_CHIP = {
  '事故': 'chip-danger',
  '路檢': 'chip-info',
  '施工': 'chip-warn',
  '管制': 'chip-accent',
}

function rateColor(v) {
  if (v >= 85) return 'col-ok'
  if (v >= 70) return 'col-warn'
  return 'col-danger'
}

// ── CSV 匯出 ───────────────────────────────────────────────
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

function exportEventCSV() {
  downloadCSV(filteredEventRows.value, [
    { h: '日期', k: 'date' }, { h: '事件類型', k: 'type' }, { h: '來源', k: 'source' },
    { h: '確認率%', k: 'confirmRate' }, { h: '平均TTL(分)', k: 'avgTtlMin' }, { h: '上架數', k: 'count' },
  ], '事件報表.csv')
}
function exportTaskCSV() {
  downloadCSV(filteredTaskRows.value, [
    { h: '日期', k: 'date' }, { h: '廣播數', k: 'broadcastCount' },
    { h: '接單率%', k: 'acceptanceRate' }, { h: '平均接單秒', k: 'avgResponseSec' }, { h: '逾時率%', k: 'timeoutRate' },
  ], '任務報表.csv')
}
function exportInfCSV() {
  downloadCSV(filteredInformantRows.value, [
    { h: '情報員ID', k: 'informantId' }, { h: '服務區域', k: 'zone' }, { h: '本月接單', k: 'monthlyCount' },
    { h: '完成率%', k: 'completionRate' }, { h: '正確率%', k: 'accuracyRate' }, { h: '積分入帳', k: 'pointsEarned' },
  ], '情報員報表.csv')
}
function exportFbCSV() {
  downloadCSV(filteredFeedbackRows.value, [
    { h: '日期', k: 'date' }, { h: '回報數', k: 'reportCount' },
    { h: '誤報率%', k: 'falseReportRate' }, { h: '一鍵確認率%', k: 'oneClickRate' },
  ], '用戶反饋報表.csv')
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
.tab-btn:hover        { color: var(--text-primary); }
.tab-btn.active       { color: var(--accent); border-bottom-color: var(--accent); }

/* 頁面主體 + 頁籤面板 */
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

/* 圖表區塊 */
.chart-section {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px 10px;
}
.chart-title { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.chart-svg     { width: 100%; display: block; }
.bar-chart-svg { width: 100%; display: block; }

/* SVG 元素（固定色，避免 CSS var 在 SVG attr 的相容問題） */
.grid-line  { stroke: rgba(255,255,255,.05); stroke-width: 1; }
.axis-line  { stroke: rgba(255,255,255,.12); stroke-width: 1; }
.axis-text  { font-family: monospace; font-size: 10px; fill: #8899AA; }
.area-fill  { fill: rgba(76,154,255,.08); }
.data-line  { fill: none; stroke: #4C9AFF; stroke-width: 2; stroke-linejoin: round; }
.data-dot   { fill: #4C9AFF; }
.bar-rect   { fill: rgba(76,154,255,.3); }
.bar-label  { font-family: monospace; font-size: 11px; fill: #8899AA; }
.bar-value  { font-family: monospace; font-size: 11px; fill: #AABBCC; }

.chart-empty {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  padding: 14px;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}

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

/* 事件類型 chip */
.type-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.chip-danger { background: rgba(229,96,76,.12);  color: var(--danger); border: 1px solid var(--danger); }
.chip-info   { background: rgba(88,193,212,.12);  color: var(--info);   border: 1px solid var(--info); }
.chip-warn   { background: rgba(230,182,58,.12);  color: var(--warn);   border: 1px solid var(--warn); }
.chip-accent { background: rgba(76,154,255,.12);  color: var(--accent); border: 1px solid var(--accent); }

/* 空態 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
