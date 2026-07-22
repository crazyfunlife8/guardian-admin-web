<template>
  <div class="op9-root">
    <OpsTopBar title="帳本管理（OP-9）" />

    <div class="content">
      <!-- 篩選列 -->
      <div class="filter-bar">
        <input
          v-model="filterState.informantId"
          type="text"
          class="filter-input id-input"
          placeholder="情報員 ID（如 GI-0042）"
        />

        <div class="date-range">
          <input
            v-model="filterState.dateFrom"
            type="date"
            class="filter-input date-input"
            title="日期（從）"
          />
          <span class="date-sep">—</span>
          <input
            v-model="filterState.dateTo"
            type="date"
            class="filter-input date-input"
            title="日期（至）"
          />
        </div>

        <select v-model="filterState.type" class="filter-select">
          <option value="all">全部類型</option>
          <option v-for="(label, key) in TX_TYPE_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <button class="clear-btn" @click="clearFilter" title="清除篩選">清除</button>
        <button class="export-btn" @click="exportCsv">匯出 CSV</button>
      </div>

      <!-- 結果摘要 -->
      <div class="result-summary">
        共 <b>{{ filteredTx.length }}</b> 筆記錄
      </div>

      <!-- 數據表 -->
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>流水號</th>
              <th>情報員 ID</th>
              <th>交易類型</th>
              <th class="num-col">金額（積分）</th>
              <th class="num-col">餘額（積分）</th>
              <th>時間</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="tx in filteredTx" :key="tx.id">
              <!-- 主資料列 -->
              <tr
                class="data-row"
                :class="{ expanded: expandedId === tx.id, odd: isOdd(tx) }"
                @click="toggleExpand(tx.id)"
              >
                <td class="mono">{{ tx.id }}</td>
                <td class="mono">{{ tx.informantId }}</td>
                <td>
                  <span class="type-chip" :class="tx.type">
                    {{ TX_TYPE_LABELS[tx.type] }}
                  </span>
                </td>
                <td class="mono num-col" :class="amountClass(tx.amount)">
                  {{ formatAmount(tx.amount) }}
                </td>
                <td class="mono num-col balance-col">
                  {{ tx.balance.toLocaleString() }}
                </td>
                <td class="mono time-col">{{ tx.date }} {{ tx.time }}</td>
              </tr>
              <!-- 展開備註列 -->
              <tr v-if="expandedId === tx.id" class="expand-row">
                <td colspan="6">
                  <div class="expand-content">
                    <span class="expand-label">備註</span>
                    <span class="expand-note">{{ tx.note }}</span>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="filteredTx.length === 0" class="empty-state">
          無符合條件的交易記錄
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted }   from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute }    from 'vue-router'
import { ref }         from 'vue'
import { useLedgerStore, TX_TYPE_LABELS } from '../stores/ledger'
import OpsTopBar from '../components/layout/OpsTopBar.vue'

const route = useRoute()
const store = useLedgerStore()
const { filteredTx, filterState } = storeToRefs(store)

const expandedId = ref(null)

// 從 OP-4 帶入的 ?gid= query param 預填情報員篩選
onMounted(() => {
  if (route.query.gid) {
    store.presetInformant(String(route.query.gid))
  }
})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function isOdd(tx) {
  return filteredTx.value.indexOf(tx) % 2 === 1
}

function formatAmount(amount) {
  if (amount === 0) return '0'
  return amount > 0 ? `+${amount.toLocaleString()}` : amount.toLocaleString()
}

function amountClass(amount) {
  if (amount > 0) return 'amount-in'
  if (amount < 0) return 'amount-out'
  return ''
}

function clearFilter() {
  store.setFilter('informantId', '')
  store.setFilter('dateFrom', '')
  store.setFilter('dateTo', '')
  store.setFilter('type', 'all')
  expandedId.value = null
}

function exportCsv() {
  const headers = ['流水號', '情報員ID', '交易類型', '金額', '餘額', '日期', '時間', '備註']
  const rows = filteredTx.value.map(tx => [
    tx.id,
    tx.informantId,
    TX_TYPE_LABELS[tx.type] ?? tx.type,
    formatAmount(tx.amount),
    tx.balance,
    tx.date,
    tx.time,
    tx.note,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `帳本管理_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.op9-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 篩選列 ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.filter-input {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  padding: 7px 12px;
  font-family: var(--sans);
}
.filter-input:focus { outline: 1px solid var(--accent); }
.id-input { width: 180px; font-family: var(--mono); }
.date-input { width: 142px; }
.date-input::-webkit-calendar-picker-indicator { filter: invert(.5); cursor: pointer; }

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}
.date-sep { color: var(--text-secondary); font-size: 13px; }

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

.clear-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-secondary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 7px 14px;
  cursor: pointer;
  transition: color .12s, border-color .12s;
}
.clear-btn:hover { color: var(--text-primary); border-color: var(--text-secondary); }

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

/* ── 結果摘要 ── */
.result-summary {
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.result-summary b { color: var(--text-primary); }

/* ── 數據表 ── */
.table-wrap { overflow-x: auto; flex: 1; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  text-align: left;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 12px;
  padding: 8px 14px 8px 0;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.num-col { text-align: right; padding-right: 0; }

.data-row {
  cursor: pointer;
  transition: background .1s;
  min-height: 44px;
}
.data-row td {
  padding: 12px 14px 12px 0;
  border-bottom: 1px solid rgba(42,53,71,.3);
  vertical-align: middle;
  color: var(--text-primary);
}
.data-row.odd { background: rgba(255,255,255,.02); }
.data-row:hover { background: var(--bg-panel-raised); }
.data-row.expanded { background: var(--bg-panel-raised); }
.data-row.expanded td { border-bottom-color: transparent; }

.mono { font-family: var(--mono); }
.time-col { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
.balance-col { color: var(--text-secondary); }

/* 金額色 */
.amount-in  { color: var(--ok); }
.amount-out { color: var(--danger); }

/* 交易類型 chip */
.type-chip {
  display: inline-block;
  font-size: 12px;
  border-radius: 4px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  color: var(--text-secondary);
  white-space: nowrap;
}
.type-chip.credit   { color: var(--ok);     border-color: var(--ok); }
.type-chip.freeze   { color: var(--info);   border-color: var(--info); }
.type-chip.deduct   { color: var(--danger); border-color: var(--danger); }
.type-chip.unfreeze { color: var(--accent); border-color: var(--accent); }
.type-chip.adjust   { color: var(--warn);   border-color: var(--warn); }

/* 展開備註列 */
.expand-row td { padding: 0; border-bottom: 1px solid rgba(42,53,71,.3); }
.expand-content {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 10px 14px 14px 0;
  background: var(--bg-panel-raised);
}
.expand-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: .06em;
  flex-shrink: 0;
}
.expand-note {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
