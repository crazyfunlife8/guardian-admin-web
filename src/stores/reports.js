import { defineStore } from 'pinia'
import { ref } from 'vue'

export const EVENT_TYPES = ['全部', '事故', '路檢', '施工', '管制']
export const ZONES       = ['全部', '北投／士林', '中正／大安', '板橋／新莊', '基隆市區']

export const useReportsStore = defineStore('reports', () => {

  // ── 事件報表（近 14 天，混合類型）──────────────────────────
  const eventRows = ref([
    { date: '2026-07-09', type: '事故', source: '用戶回報',   confirmRate: 78, avgTtlMin: 48, count: 9  },
    { date: '2026-07-09', type: '路檢', source: '警方通報',   confirmRate: 95, avgTtlMin: 32, count: 4  },
    { date: '2026-07-10', type: '事故', source: '用戶回報',   confirmRate: 82, avgTtlMin: 45, count: 11 },
    { date: '2026-07-10', type: '施工', source: '施工方申報', confirmRate: 100, avgTtlMin: 90, count: 2  },
    { date: '2026-07-11', type: '管制', source: '系統偵測',   confirmRate: 90, avgTtlMin: 60, count: 3  },
    { date: '2026-07-11', type: '事故', source: '用戶回報',   confirmRate: 75, avgTtlMin: 52, count: 14 },
    { date: '2026-07-12', type: '路檢', source: '警方通報',   confirmRate: 92, avgTtlMin: 28, count: 6  },
    { date: '2026-07-12', type: '事故', source: '用戶回報',   confirmRate: 80, avgTtlMin: 47, count: 10 },
    { date: '2026-07-13', type: '事故', source: '用戶回報',   confirmRate: 85, avgTtlMin: 43, count: 8  },
    { date: '2026-07-13', type: '施工', source: '施工方申報', confirmRate: 100, avgTtlMin: 120, count: 1 },
    { date: '2026-07-14', type: '管制', source: '系統偵測',   confirmRate: 88, avgTtlMin: 65, count: 5  },
    { date: '2026-07-14', type: '事故', source: '用戶回報',   confirmRate: 79, avgTtlMin: 50, count: 13 },
    { date: '2026-07-15', type: '路檢', source: '警方通報',   confirmRate: 97, avgTtlMin: 25, count: 7  },
    { date: '2026-07-15', type: '事故', source: '用戶回報',   confirmRate: 83, avgTtlMin: 44, count: 12 },
    { date: '2026-07-16', type: '事故', source: '用戶回報',   confirmRate: 77, avgTtlMin: 51, count: 10 },
    { date: '2026-07-16', type: '施工', source: '施工方申報', confirmRate: 100, avgTtlMin: 95, count: 3  },
    { date: '2026-07-17', type: '事故', source: '用戶回報',   confirmRate: 81, avgTtlMin: 46, count: 11 },
    { date: '2026-07-17', type: '管制', source: '系統偵測',   confirmRate: 93, avgTtlMin: 58, count: 4  },
    { date: '2026-07-18', type: '路檢', source: '警方通報',   confirmRate: 96, avgTtlMin: 30, count: 5  },
    { date: '2026-07-18', type: '事故', source: '用戶回報',   confirmRate: 84, avgTtlMin: 42, count: 9  },
    { date: '2026-07-19', type: '事故', source: '用戶回報',   confirmRate: 86, avgTtlMin: 41, count: 8  },
    { date: '2026-07-19', type: '施工', source: '施工方申報', confirmRate: 100, avgTtlMin: 110, count: 2 },
    { date: '2026-07-20', type: '事故', source: '用戶回報',   confirmRate: 88, avgTtlMin: 39, count: 7  },
    { date: '2026-07-20', type: '管制', source: '系統偵測',   confirmRate: 91, avgTtlMin: 62, count: 3  },
    { date: '2026-07-21', type: '路檢', source: '警方通報',   confirmRate: 98, avgTtlMin: 22, count: 6  },
    { date: '2026-07-21', type: '事故', source: '用戶回報',   confirmRate: 90, avgTtlMin: 38, count: 10 },
    { date: '2026-07-22', type: '事故', source: '用戶回報',   confirmRate: 87, avgTtlMin: 40, count: 6  },
    { date: '2026-07-22', type: '施工', source: '施工方申報', confirmRate: 100, avgTtlMin: 88, count: 1  },
  ])

  // ── 任務報表（近 14 天，每日一筆）─────────────────────────
  const taskRows = ref([
    { date: '2026-07-09', broadcastCount: 18, acceptanceRate: 72, avgResponseSec: 44, timeoutRate: 18 },
    { date: '2026-07-10', broadcastCount: 22, acceptanceRate: 77, avgResponseSec: 40, timeoutRate: 15 },
    { date: '2026-07-11', broadcastCount: 25, acceptanceRate: 74, avgResponseSec: 42, timeoutRate: 17 },
    { date: '2026-07-12', broadcastCount: 20, acceptanceRate: 79, avgResponseSec: 38, timeoutRate: 14 },
    { date: '2026-07-13', broadcastCount: 17, acceptanceRate: 76, avgResponseSec: 41, timeoutRate: 16 },
    { date: '2026-07-14', broadcastCount: 23, acceptanceRate: 80, avgResponseSec: 37, timeoutRate: 13 },
    { date: '2026-07-15', broadcastCount: 26, acceptanceRate: 82, avgResponseSec: 35, timeoutRate: 12 },
    { date: '2026-07-16', broadcastCount: 24, acceptanceRate: 78, avgResponseSec: 39, timeoutRate: 15 },
    { date: '2026-07-17', broadcastCount: 21, acceptanceRate: 75, avgResponseSec: 43, timeoutRate: 17 },
    { date: '2026-07-18', broadcastCount: 19, acceptanceRate: 81, avgResponseSec: 36, timeoutRate: 13 },
    { date: '2026-07-19', broadcastCount: 27, acceptanceRate: 84, avgResponseSec: 33, timeoutRate: 11 },
    { date: '2026-07-20', broadcastCount: 28, acceptanceRate: 83, avgResponseSec: 34, timeoutRate: 11 },
    { date: '2026-07-21', broadcastCount: 25, acceptanceRate: 86, avgResponseSec: 31, timeoutRate: 10 },
    { date: '2026-07-22', broadcastCount: 16, acceptanceRate: 88, avgResponseSec: 29, timeoutRate: 9  },
  ])

  // ── 情報員報表（本月，8 位）───────────────────────────────
  const informantRows = ref([
    { informantId: 'GI-0042', zone: '北投／士林', monthlyCount: 38, completionRate: 97, accuracyRate: 91, pointsEarned: 680 },
    { informantId: 'GI-0071', zone: '中正／大安', monthlyCount: 12, completionRate: 83, accuracyRate: 58, pointsEarned: 180 },
    { informantId: 'GI-0105', zone: '板橋／新莊', monthlyCount: 27, completionRate: 92, accuracyRate: 88, pointsEarned: 450 },
    { informantId: 'GI-0118', zone: '基隆市區',   monthlyCount: 5,  completionRate: 60, accuracyRate: 72, pointsEarned: 60  },
    { informantId: 'GI-0203', zone: '北投／士林', monthlyCount: 44, completionRate: 98, accuracyRate: 94, pointsEarned: 820 },
    { informantId: 'GI-0217', zone: '中正／大安', monthlyCount: 31, completionRate: 93, accuracyRate: 87, pointsEarned: 560 },
    { informantId: 'GI-0308', zone: '板橋／新莊', monthlyCount: 19, completionRate: 88, accuracyRate: 82, pointsEarned: 320 },
    { informantId: 'GI-0412', zone: '基隆市區',   monthlyCount: 8,  completionRate: 75, accuracyRate: 79, pointsEarned: 110 },
  ])

  // ── 用戶反饋報表（近 14 天，每日一筆）─────────────────────
  const feedbackRows = ref([
    { date: '2026-07-09', reportCount: 142, falseReportRate: 14, oneClickRate: 62 },
    { date: '2026-07-10', reportCount: 165, falseReportRate: 12, oneClickRate: 65 },
    { date: '2026-07-11', reportCount: 178, falseReportRate: 11, oneClickRate: 67 },
    { date: '2026-07-12', reportCount: 154, falseReportRate: 13, oneClickRate: 64 },
    { date: '2026-07-13', reportCount: 136, falseReportRate: 15, oneClickRate: 61 },
    { date: '2026-07-14', reportCount: 182, falseReportRate: 10, oneClickRate: 69 },
    { date: '2026-07-15', reportCount: 201, falseReportRate: 9,  oneClickRate: 72 },
    { date: '2026-07-16', reportCount: 189, falseReportRate: 10, oneClickRate: 70 },
    { date: '2026-07-17', reportCount: 173, falseReportRate: 11, oneClickRate: 68 },
    { date: '2026-07-18', reportCount: 158, falseReportRate: 12, oneClickRate: 66 },
    { date: '2026-07-19', reportCount: 195, falseReportRate: 9,  oneClickRate: 73 },
    { date: '2026-07-20', reportCount: 210, falseReportRate: 8,  oneClickRate: 75 },
    { date: '2026-07-21', reportCount: 203, falseReportRate: 8,  oneClickRate: 74 },
    { date: '2026-07-22', reportCount: 134, falseReportRate: 11, oneClickRate: 70 },
  ])

  return { eventRows, taskRows, informantRows, feedbackRows }
})
