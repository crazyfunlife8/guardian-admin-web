import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'

export const useReportsStore = defineStore('reports', () => {

  // ── 供給側報表（OP-11）── API 返回聚合統計，非逐情報員列表
  const supplyReport = ref(null)   // SupplyReportItem（單一物件）

  async function loadSupplyReport(from, to) {
    try {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to)   qs.set('to', to)
      const { data } = await client.get(`/api/backend/reports/supply?${qs}`)
      supplyReport.value = data
    } catch (err) {
      console.error('loadSupplyReport failed', err)
    }
  }

  // ── 年度給付彙整（C8）──────────────────────────────────────────────────────
  // AnnualPayoutItem: { informantId, informantNo, totalPoints, orderCount }
  const annualPayoutRows = ref([])
  const annualPayoutYear = ref(new Date().getFullYear())

  async function loadAnnualPayout(year) {
    try {
      annualPayoutYear.value = year ?? annualPayoutRows.value
      const { data } = await client.get(`/api/backend/reports/annual-payout?year=${year ?? annualPayoutYear.value}`)
      annualPayoutRows.value = Array.isArray(data) ? data : []
    } catch (err) {
      console.error('loadAnnualPayout failed', err)
    }
  }

  async function downloadAnnualPayoutCsv(year) {
    const y = year ?? annualPayoutYear.value
    window.open(`/api/backend/reports/annual-payout.csv?year=${y}`, '_blank')
  }

  // ── 機率回測（OP-11）──────────────────────────────────────────────────────
  const backtestResult = ref(null)

  async function loadBacktest(version, days) {
    try {
      const qs = new URLSearchParams()
      if (version) qs.set('version', version)
      if (days)    qs.set('days', days)
      const { data } = await client.get(`/api/backend/probability/backtest?${qs}`)
      backtestResult.value = data
    } catch (err) {
      console.error('loadBacktest failed', err)
    }
  }

  return {
    supplyReport, loadSupplyReport,
    annualPayoutRows, annualPayoutYear, loadAnnualPayout, downloadAnnualPayoutCsv,
    backtestResult, loadBacktest,
  }
})
