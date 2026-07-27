import { defineStore } from 'pinia'
import { ref } from 'vue'

export const ZONES = ['全部', '北投／士林', '中正／大安', '板橋／新莊', '基隆市區']

export const useReportsStore = defineStore('reports', () => {

  // ── 供給側報表（O-11）本月情報員績效 ──────────────────────
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

  // ── 年度給付彙整（C8）各年度情報員積分給付 ───────────────
  const annualPayoutRows = ref([
    // 2025
    { informantId: 'GI-0042', zone: '北投／士林', year: 2025, yearlyCount: 312, totalEarned: 5840, redeemedCount: 8,  totalRedeemed: 5200 },
    { informantId: 'GI-0071', zone: '中正／大安', year: 2025, yearlyCount: 87,  totalEarned: 1260, redeemedCount: 2,  totalRedeemed: 1000 },
    { informantId: 'GI-0105', zone: '板橋／新莊', year: 2025, yearlyCount: 221, totalEarned: 3780, redeemedCount: 5,  totalRedeemed: 3500 },
    { informantId: 'GI-0118', zone: '基隆市區',   year: 2025, yearlyCount: 43,  totalEarned:  560, redeemedCount: 1,  totalRedeemed:  500 },
    { informantId: 'GI-0203', zone: '北投／士林', year: 2025, yearlyCount: 381, totalEarned: 7120, redeemedCount: 10, totalRedeemed: 6800 },
    { informantId: 'GI-0217', zone: '中正／大安', year: 2025, yearlyCount: 258, totalEarned: 4640, redeemedCount: 6,  totalRedeemed: 4200 },
    { informantId: 'GI-0308', zone: '板橋／新莊', year: 2025, yearlyCount: 156, totalEarned: 2680, redeemedCount: 4,  totalRedeemed: 2400 },
    { informantId: 'GI-0412', zone: '基隆市區',   year: 2025, yearlyCount: 68,  totalEarned:  920, redeemedCount: 1,  totalRedeemed:  800 },
    // 2024
    { informantId: 'GI-0042', zone: '北投／士林', year: 2024, yearlyCount: 287, totalEarned: 5140, redeemedCount: 7,  totalRedeemed: 4800 },
    { informantId: 'GI-0071', zone: '中正／大安', year: 2024, yearlyCount: 61,  totalEarned:  880, redeemedCount: 1,  totalRedeemed:  800 },
    { informantId: 'GI-0105', zone: '板橋／新莊', year: 2024, yearlyCount: 198, totalEarned: 3320, redeemedCount: 4,  totalRedeemed: 3000 },
    { informantId: 'GI-0203', zone: '北投／士林', year: 2024, yearlyCount: 342, totalEarned: 6380, redeemedCount: 9,  totalRedeemed: 6000 },
    { informantId: 'GI-0217', zone: '中正／大安', year: 2024, yearlyCount: 223, totalEarned: 4080, redeemedCount: 5,  totalRedeemed: 3800 },
    { informantId: 'GI-0308', zone: '板橋／新莊', year: 2024, yearlyCount: 124, totalEarned: 2060, redeemedCount: 3,  totalRedeemed: 1800 },
  ])

  return { informantRows, annualPayoutRows }
})
