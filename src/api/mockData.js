/**
 * Guardian 後台 · API Mock 資料
 * schema 來源：guardian-openapi (2).json
 *
 * 欄位對照說明：
 *   · 所有 ID 使用數字（int64）
 *   · Enum 使用 PascalCase（API 規格）
 *   · 日期格式：ISO 8601 date-time（UTC）
 *
 * 字串 ID → 數字 ID 對照：
 *   E-30771 → 30771  E-30769 → 30769  E-30768 → 30768
 *   E-30755 → 30755  E-30760 → 30760
 *   GI-0042 → 42     GI-0071 → 71     GI-0105 → 105    GI-0118 → 118
 *   ADM-001 → 1      ADM-002 → 2      ADM-003 → 3      ADM-004 → 4
 *   AP-0001 → 1001   （資格審核申請）
 *   AP5-001 → 2001   （申訴 ticket）
 *   TK-001  → 3001   （客服工單 ticket）
 *   RD-018  → 4018   （兌換核銷單）
 *   AC-001  → 5001   （反濫用觀測）
 */

// ─────────────────────────────────────────────────────────────
// 1. Dashboard  GET /api/backend/dashboard/*
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/dashboard/todo → TodoSummary */
export const MOCK_TODO = {
  qualificationReview:     2,
  openTickets:             3,
  redemptionPendingReview: 2,
  expiredUnacceptedTasks:  0,
  suspiciousObservations:  3,
  abnormalPairings:        1,
  pipelineAlerts:          1,
  staleVerifiedEvents:     0,
}

/** GET /api/backend/dashboard/sources → SourceHealthItem[] */
export const MOCK_SOURCES = [
  { sourceKey: 'user_feedback',   displayName: '反饋',     category: 'crowd',    lastSuccessAt: '2026-07-24T14:47:00Z', recentCount: 12, stale: false },
  { sourceKey: 'sensor',          displayName: '感測',     category: 'sensor',   lastSuccessAt: '2026-07-24T14:46:55Z', recentCount: 8,  stale: false },
  { sourceKey: 'open_data',       displayName: '開放資料', category: 'external', lastSuccessAt: '2026-07-24T14:00:00Z', recentCount: 3,  stale: true  },
  { sourceKey: 'partner',         displayName: '合作',     category: 'external', lastSuccessAt: '2026-07-24T14:42:31Z', recentCount: 5,  stale: false },
  { sourceKey: 'prob_batch',      displayName: '機率批次', category: 'internal', lastSuccessAt: '2026-07-24T14:47:28Z', recentCount: 0,  stale: false },
  { sourceKey: 'hotspot',         displayName: '熱點',     category: 'internal', lastSuccessAt: '2026-07-24T14:45:00Z', recentCount: 2,  stale: false },
  { sourceKey: 'informant_net',   displayName: '情報網',   category: 'crowd',    lastSuccessAt: '2026-07-24T14:20:00Z', recentCount: 0,  stale: true  },
]

/** GET /api/backend/dashboard/map → MapEventItem[] */
export const MOCK_MAP_EVENTS = [
  { id: 30771, type: 'Checkpoint',   status: 'Unconfirmed', lat: 25.0220, lng: 121.4960, at: '2026-07-24T14:44:00Z' },
  { id: 30769, type: 'Checkpoint',   status: 'Verified',    lat: 25.0583, lng: 121.5187, at: '2026-07-24T14:30:00Z' },
  { id: 30768, type: 'Accident',     status: 'Verified',    lat: 25.0478, lng: 121.5567, at: '2026-07-24T14:26:00Z' },
  { id: 30755, type: 'Construction', status: 'Verified',    lat: 25.0678, lng: 121.5122, at: '2026-07-24T12:42:00Z' },
  { id: 30760, type: 'Control',      status: 'Unconfirmed', lat: 25.0188, lng: 121.5441, at: '2026-07-24T13:52:00Z' },
]

/** GET /api/backend/dashboard/activity → ActivityItem[] */
export const MOCK_ACTIVITY = [
  { id: 101, actorType: 'System',    actorId: 0,  action: 'PipelineAlert',  targetType: 'Source',  targetId: 0,     at: '2026-07-24T14:47:28Z' },
  { id: 102, actorType: 'System',    actorId: 0,  action: 'TaskEscalated',  targetType: 'Task',    targetId: 88213, at: '2026-07-24T14:47:12Z' },
  { id: 103, actorType: 'System',    actorId: 0,  action: 'EventCreated',   targetType: 'Event',   targetId: 30771, at: '2026-07-24T14:46:55Z' },
  { id: 104, actorType: 'Operator',  actorId: 2,  action: 'EventTakenDown', targetType: 'Event',   targetId: 30764, at: '2026-07-24T14:46:31Z' },
  { id: 105, actorType: 'Informant', actorId: 42, action: 'TaskAccepted',   targetType: 'Task',    targetId: 88209, at: '2026-07-24T14:45:58Z' },
  { id: 106, actorType: 'System',    actorId: 0,  action: 'AbuseDetected',  targetType: 'Device',  targetId: 0,     at: '2026-07-24T14:45:20Z' },
  { id: 107, actorType: 'System',    actorId: 0,  action: 'EventVerified',  targetType: 'Event',   targetId: 30768, at: '2026-07-24T14:44:47Z' },
]

// ─────────────────────────────────────────────────────────────
// 2. Events  GET /api/events/{id}
//   EventType:   Checkpoint | Accident | Construction | Control | Flooding
//   EventStatus: Unconfirmed | Verified | Expired | Cleared | FalseReport
//   ActorType:   System | Informant | User | Operator
// ─────────────────────────────────────────────────────────────

/** GET /api/events/{id} → EventResponse */
export const MOCK_EVENTS = [
  {
    id: 30771, type: 'Checkpoint', status: 'Unconfirmed',
    lat: 25.0220, lng: 121.4960, direction: '北向',
    adminAreaCode: 'TPE', gridCode: 'G-042', sourceId: 1,
    ttlExpiresAt: '2026-07-24T15:25:00Z', createdAt: '2026-07-24T14:44:00Z',
    distanceMeters: null,
    history: [
      { fromStatus: null,          toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:44:00Z', actorType: 'System', actorId: 0, basis: '用戶反饋' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:45:00Z', actorType: 'System', actorId: 0, basis: '驗證任務廣播（半徑 2 檔）' },
    ],
  },
  {
    id: 30769, type: 'Checkpoint', status: 'Verified',
    lat: 25.0583, lng: 121.5187, direction: '南向',
    adminAreaCode: 'TPE', gridCode: 'G-033', sourceId: 7,
    ttlExpiresAt: '2026-07-24T15:22:00Z', createdAt: '2026-07-24T14:30:00Z',
    distanceMeters: null,
    history: [
      { fromStatus: null,          toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:30:00Z', actorType: 'System',    actorId: 0,  basis: '情報網' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:32:00Z', actorType: 'System',    actorId: 0,  basis: '驗證任務廣播' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:33:00Z', actorType: 'Informant', actorId: 42, basis: '情報員 GI-0042 接單・鎖定 15 分' },
      { fromStatus: 'Unconfirmed', toStatus: 'Verified',    changedAt: '2026-07-24T14:35:00Z', actorType: 'Informant', actorId: 42, basis: '情報員驗證通過' },
    ],
  },
  {
    id: 30768, type: 'Accident', status: 'Verified',
    lat: 25.0478, lng: 121.5567, direction: '東向',
    adminAreaCode: 'TPE', gridCode: 'G-071', sourceId: 2,
    ttlExpiresAt: '2026-07-24T15:51:00Z', createdAt: '2026-07-24T14:26:00Z',
    distanceMeters: null,
    history: [
      { fromStatus: null,          toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:26:00Z', actorType: 'System', actorId: 0, basis: '感測' },
      { fromStatus: 'Unconfirmed', toStatus: 'Verified',    changedAt: '2026-07-24T14:27:00Z', actorType: 'System', actorId: 0, basis: '感測佐證印證' },
    ],
  },
  {
    id: 30755, type: 'Construction', status: 'Verified',
    lat: 25.0678, lng: 121.5122, direction: null,
    adminAreaCode: 'TPE', gridCode: 'G-021', sourceId: 4,
    ttlExpiresAt: '2026-07-24T18:37:00Z', createdAt: '2026-07-24T12:42:00Z',
    distanceMeters: null,
    history: [
      { fromStatus: null, toStatus: 'Verified', changedAt: '2026-07-24T12:42:00Z', actorType: 'System', actorId: 0, basis: '合作通報（已驗證）' },
    ],
  },
  {
    id: 30760, type: 'Control', status: 'Unconfirmed',
    lat: 25.0188, lng: 121.5441, direction: null,
    adminAreaCode: 'TPE', gridCode: 'G-066', sourceId: 1,
    ttlExpiresAt: '2026-07-24T14:52:00Z', createdAt: '2026-07-24T13:52:00Z',
    distanceMeters: null,
    history: [
      { fromStatus: null,          toStatus: 'Unconfirmed', changedAt: '2026-07-24T13:52:00Z', actorType: 'System', actorId: 0, basis: '用戶反饋' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T13:54:00Z', actorType: 'System', actorId: 0, basis: '驗證任務廣播' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:09:00Z', actorType: 'System', actorId: 0, basis: '逾時無人接・半徑放大第 1 檔' },
      { fromStatus: 'Unconfirmed', toStatus: 'Unconfirmed', changedAt: '2026-07-24T14:24:00Z', actorType: 'System', actorId: 0, basis: '逾時無人接・半徑放大第 2 檔' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// 3. Informant Applications  GET /api/backend/informants/applications
//   state: Pending | Approved | Rejected
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/informants/applications → ApplicationListItem[] */
export const MOCK_APPLICATIONS = [
  { id: 1001, state: 'Pending',  qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-24T07:20:00Z' },
  { id: 1002, state: 'Pending',  qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-24T08:45:00Z' },
  { id: 1003, state: 'Approved', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T16:10:00Z' },
  { id: 1004, state: 'Approved', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T09:30:00Z' },
  { id: 1005, state: 'Rejected', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T14:00:00Z' },
  { id: 1006, state: 'Rejected', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-22T11:20:00Z' },
]

/**
 * GET /api/backend/informants/{id} → ApplicationDetail
 * 包含解密個資（後台限定）
 */
export const MOCK_APPLICATION_DETAILS = {
  1001: { id: 1001, state: 'Pending',  phone: '****8847', name: '陳志豪', idNo: 'A***-0001', payoutAccount: '***-8847', email: 'user1001@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-24T07:20:00Z' },
  1002: { id: 1002, state: 'Pending',  phone: '****3312', name: '林美玲', idNo: 'B***-0002', payoutAccount: '***-3312', email: 'user1002@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-24T08:45:00Z' },
  1003: { id: 1003, state: 'Approved', phone: '****6601', name: '王建民', idNo: 'C***-0003', payoutAccount: '***-6601', email: 'user1003@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T16:10:00Z' },
  1004: { id: 1004, state: 'Approved', phone: '****2298', name: '黃怡君', idNo: 'D***-0004', payoutAccount: '***-2298', email: 'user1004@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T09:30:00Z' },
  1005: { id: 1005, state: 'Rejected', phone: '****7743', name: '李俊宏', idNo: 'E***-0005', payoutAccount: '***-7743', email: 'user1005@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-23T14:00:00Z' },
  1006: { id: 1006, state: 'Rejected', phone: '****5591', name: '張雅婷', idNo: 'F***-0006', payoutAccount: '***-5591', email: 'user1006@example.com', qualType: 'Driver', certFileUrl: null, appliedAt: '2026-07-22T11:20:00Z' },
}

// ─────────────────────────────────────────────────────────────
// 4. Informant Profiles  GET /api/backend/informants/{id}/profile
//   state: Active | Suspended | Reviewing | Removed
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/backend/informants/{id}/profile → InformantProfileResponse
 * 以 informantId（數字）為 key
 */
export const MOCK_PROFILES = {
  42: {
    id: 42, informantNo: 'GI-0042', state: 'Active',
    reputationScore: 94, qualType: 'Driver', qualStatus: 'Valid',
    activeSessionCount: 1,
    reputationHistory: [
      { delta: -5, reason: '任務評分爭議調查結果', refType: 'Ticket', refId: 2004, createdAt: '2026-04-22T10:00:00Z' },
      { delta: 5,  reason: '申訴成立補正',         refType: 'Ticket', refId: 2004, createdAt: '2026-04-22T14:00:00Z' },
    ],
  },
  71: {
    id: 71, informantNo: 'GI-0071', state: 'Active',
    reputationScore: 88, qualType: 'Driver', qualStatus: 'Valid',
    activeSessionCount: 0,
    reputationHistory: [],
  },
  105: {
    id: 105, informantNo: 'GI-0105', state: 'Suspended',
    reputationScore: 41, qualType: 'Driver', qualStatus: 'Suspended',
    activeSessionCount: 0,
    reputationHistory: [
      { delta: -20, reason: '單人作假佐證確認（AC-004）', refType: 'Ticket', refId: 5004, createdAt: '2026-07-08T15:40:00Z' },
    ],
  },
  118: {
    id: 118, informantNo: 'GI-0118', state: 'Reviewing',
    reputationScore: null, qualType: 'Driver', qualStatus: 'Pending',
    activeSessionCount: 0,
    reputationHistory: [],
  },
}

// ─────────────────────────────────────────────────────────────
// 5. Ledger  GET /api/backend/informants/{id}/ledger
//            GET /api/backend/informants/{id}/invariant
//   entryType:    Credit | Debit | Freeze | Unfreeze | Defer | DeferRelease
//   sourceRefType: Task | Adjustment | Redemption
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/backend/informants/{id}/ledger → LedgerEntryItem[]
 * 以 informantId（數字）為 key
 *
 * 注意：API 規格無 balance/note 欄位，串接時需評估是否需後端補充
 */
export const MOCK_LEDGER = {
  42: [
    { id: 16, entryType: 'Freeze',  amount: -500,  sourceRefType: 'Redemption', sourceRefId: 4003, createdAt: '2026-07-20T13:15:00Z' },
    { id: 15, entryType: 'Credit',  amount:  200,  sourceRefType: 'Task',       sourceRefId: 1042, createdAt: '2026-07-20T11:42:00Z' },
    { id: 14, entryType: 'Credit',  amount:  180,  sourceRefType: 'Task',       sourceRefId: 1035, createdAt: '2026-07-19T16:08:00Z' },
    { id: 13, entryType: 'Credit',  amount:  200,  sourceRefType: 'Task',       sourceRefId: 1029, createdAt: '2026-07-19T09:31:00Z' },
    { id: 12, entryType: 'Debit',   amount: -1000, sourceRefType: 'Redemption', sourceRefId: 4001, createdAt: '2026-07-18T14:22:00Z' },
    { id: 11, entryType: 'Credit',  amount:  100,  sourceRefType: 'Task',       sourceRefId: 1018, createdAt: '2026-07-17T10:55:00Z' },
  ],
  71: [
    { id: 10, entryType: 'Credit',   amount:  180, sourceRefType: 'Task',       sourceRefId: 1041, createdAt: '2026-07-20T14:50:00Z' },
    { id: 9,  entryType: 'Credit',   amount:  130, sourceRefType: 'Task',       sourceRefId: 1022, createdAt: '2026-07-19T08:17:00Z' },
    { id: 8,  entryType: 'Unfreeze', amount:  300, sourceRefType: 'Redemption', sourceRefId: 4002, createdAt: '2026-07-17T17:30:00Z' },
    { id: 7,  entryType: 'Freeze',   amount: -300, sourceRefType: 'Redemption', sourceRefId: 4002, createdAt: '2026-07-16T11:00:00Z' },
  ],
  105: [
    { id: 6, entryType: 'Freeze',  amount: -200, sourceRefType: 'Redemption', sourceRefId: 4004, createdAt: '2026-07-10T09:05:00Z' },
    { id: 5, entryType: 'Debit',   amount: -150, sourceRefType: 'Adjustment', sourceRefId: 5004, createdAt: '2026-07-08T15:40:00Z' },
    { id: 4, entryType: 'Credit',  amount:  100, sourceRefType: 'Task',       sourceRefId: 891,  createdAt: '2026-07-05T10:22:00Z' },
  ],
  118: [
    { id: 3, entryType: 'Credit',  amount:  80, sourceRefType: 'Task',       sourceRefId: 1031, createdAt: '2026-07-18T16:20:00Z' },
    { id: 2, entryType: 'Credit',  amount:  50, sourceRefType: 'Adjustment', sourceRefId: 0,    createdAt: '2026-07-15T09:00:00Z' },
    { id: 1, entryType: 'Credit',  amount:   0, sourceRefType: 'Adjustment', sourceRefId: 0,    createdAt: '2026-07-14T18:00:00Z' },
  ],
}

/** GET /api/backend/informants/{id}/invariant → InvariantCheckResponse */
export const MOCK_INVARIANTS = {
  42:  { snapshotAvailable: 2150, snapshotFrozen: 500, snapshotDeferred: 0, expectedAvailable: 2150, expectedFrozen: 500, expectedDeferred: 0, ok: true  },
  71:  { snapshotAvailable:  870, snapshotFrozen:   0, snapshotDeferred: 0, expectedAvailable:  870, expectedFrozen:   0, expectedDeferred: 0, ok: true  },
  105: { snapshotAvailable:    0, snapshotFrozen: 200, snapshotDeferred: 0, expectedAvailable:    0, expectedFrozen: 200, expectedDeferred: 0, ok: true  },
  118: { snapshotAvailable:   80, snapshotFrozen:   0, snapshotDeferred: 0, expectedAvailable:   80, expectedFrozen:   0, expectedDeferred: 0, ok: true  },
}

// ─────────────────────────────────────────────────────────────
// 6. Tickets  GET /api/backend/tickets
//   ticketType: ChangeRequest（申訴/OP-5） | Support（客服工單/OP-13）
//   status:     Open | InProgress | Resolved
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/backend/tickets → TicketListItem[]
 * GET /api/backend/tickets/{id} → TicketResponse
 *
 * 注意：history 欄位為 UI 擴充，API 規格未定義，串接後改由 audit log 取得
 */
export const MOCK_TICKETS = [
  // ── 申訴工單（OP-5）ticketType: ChangeRequest ──────────────
  {
    id: 2001, ticketType: 'ChangeRequest', subtype: '任務評分爭議',
    relatedType: 'Event', relatedId: 30768,
    submitterType: 'Informant', submitterId: 42,
    content: '本次任務回報的路況屬實，但系統評分為誤報，請求重新審核評分結果。回報時間與事件發生時間吻合，現場照片存於任務記錄中。',
    status: 'Open', channel: 'App', assignedTo: null, resolution: null,
    createdAt: '2026-07-24T08:30:00Z', resolvedAt: null,
    // UI 擴充欄位（API 無）
    history: [{ time: '2026-07-24T08:30:00Z', text: '申訴提交', actor: '系統' }],
  },
  {
    id: 2002, ticketType: 'ChangeRequest', subtype: '誤報判定爭議',
    relatedType: 'Event', relatedId: 30771,
    submitterType: 'Informant', submitterId: 71,
    content: '回報當時確有施工封路，惟事後施工結束導致難以驗證，請求重新評估當時的判定依據。',
    status: 'InProgress', channel: 'App', assignedTo: 2, resolution: null,
    createdAt: '2026-07-23T14:20:00Z', resolvedAt: null,
    history: [
      { time: '2026-07-23T14:20:00Z', text: '申訴提交', actor: '系統' },
      { time: '2026-07-23T14:35:00Z', text: '受理申訴，進入調查（內部查核）', actor: 'ADM-002' },
    ],
  },
  {
    id: 2003, ticketType: 'ChangeRequest', subtype: '停權申訴',
    relatedType: null, relatedId: null,
    submitterType: 'Informant', submitterId: 105,
    content: '否認相關違規行為，聲稱系統誤判，請求審查停權決定並提供詳細違規紀錄。',
    status: 'Resolved', channel: 'App', assignedTo: 1, resolution: 'Rejected',
    createdAt: '2026-07-23T10:00:00Z', resolvedAt: '2026-07-23T13:00:00Z',
    history: [
      { time: '2026-07-23T10:00:00Z', text: '申訴提交', actor: '系統' },
      { time: '2026-07-23T10:20:00Z', text: '受理申訴，進入調查（內部查核）', actor: 'ADM-001' },
      { time: '2026-07-23T13:00:00Z', text: '裁決不成立（規則判定）', actor: 'ADM-001' },
    ],
  },
  {
    id: 2004, ticketType: 'ChangeRequest', subtype: '積分計算爭議',
    relatedType: null, relatedId: null,
    submitterType: 'Informant', submitterId: 42,
    content: '本月完成任務 38 件，但積分入帳僅反映 31 件，差異 7 件請求確認原因並補發積分。',
    status: 'Resolved', channel: 'App', assignedTo: 1, resolution: 'Upheld',
    createdAt: '2026-07-21T09:15:00Z', resolvedAt: '2026-07-21T14:00:00Z',
    history: [
      { time: '2026-07-21T09:15:00Z', text: '申訴提交', actor: '系統' },
      { time: '2026-07-21T09:30:00Z', text: '受理申訴，進入調查（內部查核）', actor: 'ADM-001' },
      { time: '2026-07-21T14:00:00Z', text: '裁決成立（調查核實）', actor: 'ADM-001' },
    ],
  },
  {
    id: 2005, ticketType: 'ChangeRequest', subtype: '任務評分爭議',
    relatedType: 'Event', relatedId: 30769,
    submitterType: 'Informant', submitterId: 118,
    content: '首次任務遭評為誤報，但回報位置與事件位置完全相符，請求覆核評分依據。',
    status: 'Open', channel: 'App', assignedTo: null, resolution: null,
    createdAt: '2026-07-24T06:50:00Z', resolvedAt: null,
    history: [{ time: '2026-07-24T06:50:00Z', text: '申訴提交', actor: '系統' }],
  },

  // ── 客服工單（OP-13）ticketType: Support ────────────────────
  {
    id: 3001, ticketType: 'Support', subtype: '積分爭議',
    relatedType: 'Informant', relatedId: 42,
    submitterType: 'Operator', submitterId: 2,
    content: '本月任務完成率達標但積分未正常入帳，已等待超過 48 小時，系統顯示「處理中」但無進一步說明。',
    status: 'Open', channel: 'Backend', assignedTo: null, resolution: null,
    createdAt: '2026-07-22T08:30:00Z', resolvedAt: null,
    history: [{ time: '2026-07-22T08:30:00Z', text: '工單建立', actor: 'ADM-002' }],
  },
  {
    id: 3002, ticketType: 'Support', subtype: '帳號問題',
    relatedType: 'Informant', relatedId: 31,
    submitterType: 'Operator', submitterId: 1,
    content: '帳號無法登入，重設密碼後仍顯示「帳號已停用」，但運營人員未收到任何停用通知。',
    status: 'InProgress', channel: 'Backend', assignedTo: 3, resolution: null,
    createdAt: '2026-07-21T14:15:00Z', resolvedAt: null,
    history: [
      { time: '2026-07-21T14:15:00Z', text: '工單建立', actor: 'ADM-001' },
      { time: '2026-07-21T15:03:00Z', text: '受理，開始調查帳號停用記錄', actor: 'ADM-003' },
    ],
  },
  {
    id: 3003, ticketType: 'Support', subtype: '任務糾紛',
    relatedType: 'Event', relatedId: 30768,
    submitterType: 'Operator', submitterId: 2,
    content: '情報員反映驗證任務廣播後無人接單，逾時後系統自動記為「逾時失敗」並扣除信譽分，認為應屬系統異常非個人失誤。',
    status: 'InProgress', channel: 'Backend', assignedTo: 2, resolution: null,
    createdAt: '2026-07-21T09:45:00Z', resolvedAt: null,
    history: [
      { time: '2026-07-21T09:45:00Z', text: '工單建立', actor: 'ADM-002' },
      { time: '2026-07-21T10:22:00Z', text: '受理，查詢事件廣播紀錄', actor: 'ADM-002' },
      { time: '2026-07-21T11:15:00Z', text: '回覆：廣播紀錄顯示當時區域情報員均離線，確認為覆蓋率不足，非系統故障', actor: 'ADM-002' },
    ],
  },
  {
    id: 3004, ticketType: 'Support', subtype: '系統反饋',
    relatedType: null, relatedId: null,
    submitterType: 'Operator', submitterId: 1,
    content: '建議 App 地圖事件圖標改為更易辨識的形狀，目前圓形圖標在深色底圖上不夠清晰。',
    status: 'Resolved', channel: 'Backend', assignedTo: 1, resolution: '已轉交產品團隊，列入下版本迭代評估',
    createdAt: '2026-07-20T16:00:00Z', resolvedAt: '2026-07-20T17:00:00Z',
    history: [
      { time: '2026-07-20T16:00:00Z', text: '工單建立', actor: 'ADM-001' },
      { time: '2026-07-20T16:30:00Z', text: '受理，轉記產品反饋清單', actor: 'ADM-001' },
      { time: '2026-07-20T17:00:00Z', text: '結案：已轉交產品團隊，列入下版本迭代評估', actor: 'ADM-001' },
    ],
  },
  {
    id: 3005, ticketType: 'Support', subtype: '積分爭議',
    relatedType: 'Informant', relatedId: 28,
    submitterType: 'Operator', submitterId: 3,
    content: '稱積分遭系統誤扣，但核對兌換核銷記錄 RD-0001 顯示扣除合規，資料有誤。',
    status: 'Resolved', channel: 'Backend', assignedTo: 3, resolution: '核對 RD-0001，扣除操作符合規則，無誤扣情形',
    createdAt: '2026-07-19T11:20:00Z', resolvedAt: '2026-07-19T13:45:00Z',
    history: [
      { time: '2026-07-19T11:20:00Z', text: '工單建立', actor: 'ADM-003' },
      { time: '2026-07-19T12:00:00Z', text: '受理，查核兌換核銷記錄', actor: 'ADM-003' },
      { time: '2026-07-19T13:45:00Z', text: '結案：核對 RD-0001，扣除操作符合規則，無誤扣情形', actor: 'ADM-003' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// 7. Redemptions  GET /api/backend/redemptions
//   status: Applied | PendingReview | Reserved | Disbursed | Deducted | Rejected | Held
//   source: Form | LineManual
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/redemptions → RedemptionResponse[] */
export const MOCK_REDEMPTIONS = [
  {
    id: 4018, informantId: 42, source: 'Form',
    items: '現金 NT$8,000', amountPoints: 8000,
    status: 'PendingReview', voucherInfo: null,
    createdAt: '2026-07-24T14:31:00Z', disbursedAt: null,
    // UI 擴充欄位（API 無）
    maskedAccount: '●●●-●●●●●●-●42', realAccount: '012-123456-042',
  },
  {
    id: 4017, informantId: 18, source: 'LineManual',
    items: '加油券 NT$3,000', amountPoints: 3000,
    status: 'PendingReview', voucherInfo: null,
    createdAt: '2026-07-24T13:56:00Z', disbursedAt: null,
    maskedAccount: '●●●-●●●●●●-●18', realAccount: '012-654321-018',
  },
  {
    id: 4016, informantId: 67, source: 'Form',
    items: '現金 NT$12,000', amountPoints: 12000,
    status: 'Reserved', voucherInfo: null,
    createdAt: '2026-07-24T12:12:00Z', disbursedAt: null,
    maskedAccount: '●●●-●●●●●●-●67', realAccount: '012-789012-067',
  },
  {
    id: 4015, informantId: 29, source: 'Form',
    items: '禮券 NT$1,500', amountPoints: 1500,
    status: 'Held', voucherInfo: null,
    createdAt: '2026-07-24T11:40:00Z', disbursedAt: null,
    maskedAccount: '●●●-●●●●●●-●29', realAccount: '012-345678-029',
  },
  {
    id: 4014, informantId: 42, source: 'Form',
    items: '現金 NT$5,000', amountPoints: 5000,
    status: 'Disbursed', voucherInfo: 'VOUCHER-2026-0714-001',
    createdAt: '2026-07-24T10:03:00Z', disbursedAt: '2026-07-24T10:25:00Z',
    maskedAccount: '●●●-●●●●●●-●42', realAccount: '012-123456-042',
  },
]

// ─────────────────────────────────────────────────────────────
// 8. Abuse  GET /api/backend/abuse/suspicious-observations
//           GET /api/backend/abuse/pairing-report
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/backend/abuse/suspicious-observations → SuspiciousObservationItem[]
 *
 * 注意：API 規格的 SuspiciousObservation 僅含基本觀測記錄，
 * OP-7 UI 所需的 status/history/reports 為 UI 擴充欄位，串接時須釐清後端是否提供
 */
export const MOCK_SUSPICIOUS_OBS = [
  {
    id: 5001, canonicalEventId: 30771, reporterInformantId: 42,
    taskId: 88100, rawFields: '{"fake_ratio":0.40,"monthly_false":18,"monthly_total":45}',
    observedAt: '2026-07-24T09:12:00Z',
    // UI 擴充欄位
    ruleKey: 'fake_ratio_pct', status: 'Pending',
    history: [{ time: '2026-07-24T09:12:00Z', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' }],
  },
  {
    id: 5002, canonicalEventId: null, reporterInformantId: null,
    taskId: null, rawFields: '{"device_uid":"D-c3f4","report_count":7,"window_minutes":30}',
    observedAt: '2026-07-24T10:44:00Z',
    ruleKey: 'high_freq_count', status: 'Pending',
    history: [{ time: '2026-07-24T10:44:00Z', text: '系統觸發覆核，高頻回報次數超過閾值', actor: '系統' }],
  },
  {
    id: 5003, canonicalEventId: null, reporterInformantId: 71,
    taskId: 88050, rawFields: '{"jump_km":23.4,"threshold_km":10}',
    observedAt: '2026-07-23T14:20:00Z',
    ruleKey: 'location_jump_km', status: 'Pending',
    history: [{ time: '2026-07-23T14:20:00Z', text: '系統觸發覆核，相鄰回報位置跳躍距離異常', actor: '系統' }],
  },
  {
    id: 5004, canonicalEventId: null, reporterInformantId: 105,
    taskId: 87900, rawFields: '{"fake_ratio":0.50,"monthly_false":11,"monthly_total":22}',
    observedAt: '2026-07-23T09:05:00Z',
    ruleKey: 'fake_ratio_pct', status: 'Confirmed',
    history: [
      { time: '2026-07-23T09:05:00Z', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' },
      { time: '2026-07-23T09:32:00Z', text: '確認違規，執行停權（確認違規）', actor: 'ADM-002' },
    ],
  },
  {
    id: 5005, canonicalEventId: null, reporterInformantId: null,
    taskId: null, rawFields: '{"device_uid":"D-f96e","report_count":9,"window_minutes":30}',
    observedAt: '2026-07-22T16:00:00Z',
    ruleKey: 'high_freq_count', status: 'Cleared',
    history: [
      { time: '2026-07-22T16:00:00Z', text: '系統觸發覆核，高頻回報次數超過閾值', actor: '系統' },
      { time: '2026-07-22T16:25:00Z', text: '誤判解除，撤銷警示（多方佐證）', actor: 'ADM-002' },
    ],
  },
  {
    id: 5006, canonicalEventId: null, reporterInformantId: 118,
    taskId: 87800, rawFields: '{"fake_ratio":0.50,"monthly_false":3,"monthly_total":6}',
    observedAt: '2026-07-22T11:10:00Z',
    ruleKey: 'fake_ratio_pct', status: 'Cleared',
    history: [
      { time: '2026-07-22T11:10:00Z', text: '系統觸發覆核，單人作假比率超過閾值', actor: '系統' },
      { time: '2026-07-22T11:40:00Z', text: '誤判解除，撤銷警示（調查核實：新成員回報準確率低屬正常）', actor: 'ADM-002' },
    ],
  },
]

/** GET /api/backend/abuse/pairing-report → PairingReportItem[] */
export const MOCK_PAIRING_REPORT = [
  { reporterInformantId: 42,  holderInformantId: 71,  count: 8 },
  { reporterInformantId: 105, holderInformantId: 42,  count: 5 },
  { reporterInformantId: 71,  holderInformantId: 118, count: 3 },
]

// ─────────────────────────────────────────────────────────────
// 9. Parameters  GET /api/backend/parameters
//   value 為 string（API 規格），dataType 指示如何解析
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/parameters → ParameterItem[] */
export const MOCK_PARAMETERS = [
  { key: 'inspection_ttl',       value: '30',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-22T09:15:30Z' },
  { key: 'accident_ttl',         value: '60',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'construction_ttl',     value: '120',   dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'control_ttl',          value: '90',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'max_extend_count',     value: '3',     dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'auto_takedown_wait',   value: '5',     dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'broadcast_radius_1',   value: '500',   dataType: 'integer', changedBy: 1, updatedAt: '2026-07-21T17:05:40Z' },
  { key: 'broadcast_radius_2',   value: '1000',  dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'broadcast_radius_3',   value: '2000',  dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'escalation_wait',      value: '10',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'lock_duration',        value: '15',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'exchange_rate',        value: '100',   dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'single_limit',         value: '20000', dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'monthly_limit',        value: '50000', dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'broadcast_cooldown',   value: '30',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'alert_repeat_interval',value: '5',     dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  // 反濫用規則（OP-7）同走 parameters endpoint
  { key: 'high_freq_count',      value: '5',     dataType: 'integer', changedBy: 1, updatedAt: '2026-07-22T11:45:19Z' },
  { key: 'high_freq_minutes',    value: '30',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'location_jump_km',     value: '10',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
  { key: 'fake_ratio_pct',       value: '40',    dataType: 'integer', changedBy: 1, updatedAt: '2026-07-01T00:00:00Z' },
]

// ─────────────────────────────────────────────────────────────
// 10. Static Data
//    GET /api/backend/hotspots
//    GET /api/backend/coverage-areas
//    GET /api/backend/region-modes
//    GET /api/backend/region-modes
//   AreaTaskMode: Normal | DisplayOnly | PauseNew | InternalOnly
//   EventType:   Checkpoint | Accident | Construction | Control | Flooding
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/hotspots → HotspotItem[] */
export const MOCK_HOTSPOTS = [
  { id: 1, lat: 25.1276, lng: 121.7392, roadSegment: '基隆市區',     enabled: true, sourceId: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-21T16:00:01Z' },
  { id: 2, lat: 25.0478, lng: 121.5170, roadSegment: '台北火車站周邊', enabled: true, sourceId: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 3, lat: 25.0830, lng: 121.5654, roadSegment: '中山高速公路匝道', enabled: true, sourceId: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

/**
 * GET /api/backend/coverage-areas → CoverageAreaItem[]
 * 後端設計為複數集合（MultiPolygon），前端目前顯示單一邊界
 */
export const MOCK_COVERAGE_AREAS = [
  {
    id: 1, name: '大台北服務範圍', coverageLevel: 'Primary',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[[[121.45, 24.95], [121.85, 24.95], [121.85, 25.25], [121.45, 25.25], [121.45, 24.95]]]],
    },
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]

/** GET /api/backend/region-modes → RegionModeItem[] */
export const MOCK_REGION_MODES = [
  { adminAreaCode: 'TPE', eventType: 'Checkpoint',   mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'TPE', eventType: 'Accident',     mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'TPE', eventType: 'Construction', mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'TPE', eventType: 'Control',      mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'TPE', eventType: 'Flooding',     mode: 'DisplayOnly', updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'KEE', eventType: 'Checkpoint',   mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'KEE', eventType: 'Accident',     mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'KEE', eventType: 'Construction', mode: 'Normal',      updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'KEE', eventType: 'Control',      mode: 'PauseNew',    updatedAt: '2026-07-01T00:00:00Z' },
  { adminAreaCode: 'KEE', eventType: 'Flooding',     mode: 'DisplayOnly', updatedAt: '2026-07-01T00:00:00Z' },
]

// ─────────────────────────────────────────────────────────────
// 11. Reports  GET /api/backend/reports/supply
//              GET /api/backend/reports/annual-payout
//              GET /api/backend/audit
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/reports/supply → SupplyReportItem（本月彙整） */
export const MOCK_SUPPLY_REPORT = {
  fromUtc: '2026-07-01T00:00:00Z',
  toUtc:   '2026-07-24T15:00:00Z',
  activeInformants:                8,
  tasksCreated:                  184,
  tasksAccepted:                 176,
  acceptanceRate:                0.957,
  avgVerificationLatencyMinutes: 4.3,
  creditTotal:                  3180,
  verifiedEventCount:            162,
  costPerIntel:                 19.6,
}

/** GET /api/backend/reports/annual-payout → AnnualPayoutItem[] */
export const MOCK_ANNUAL_PAYOUT = [
  // 2026（年初至今）
  { informantId: 42,  informantNo: 'GI-0042', totalPoints: 3180, orderCount: 3 },
  { informantId: 71,  informantNo: 'GI-0071', totalPoints:  870, orderCount: 0 },
  { informantId: 105, informantNo: 'GI-0105', totalPoints:  350, orderCount: 0 },
  { informantId: 118, informantNo: 'GI-0118', totalPoints:   80, orderCount: 0 },
  { informantId: 203, informantNo: 'GI-0203', totalPoints: 4120, orderCount: 5 },
  { informantId: 217, informantNo: 'GI-0217', totalPoints: 2980, orderCount: 3 },
  { informantId: 308, informantNo: 'GI-0308', totalPoints: 1540, orderCount: 2 },
  { informantId: 412, informantNo: 'GI-0412', totalPoints:  560, orderCount: 1 },
]

/**
 * GET /api/backend/audit → AuditItem[]
 * OP-11（操作稽核報表）與 OP-12（操作日誌）共用此端點
 *
 * API 欄位對照（store → API）：
 *   operatorId → actorId（數字）
 *   actionType → action
 *   target     → targetType + targetId
 *   reason     → detail
 *   ip         → API 未定義（UI 擴充）
 */
export const MOCK_AUDIT = [
  { id: 1,  actorType: 'Operator', actorId: 1, action: 'ParameterUpdated', targetType: 'Parameter', targetId: 0,     detail: 'inspection_ttl：運營調整',  at: '2026-07-22T09:15:30Z', ip: '192.168.1.10' },
  { id: 2,  actorType: 'Operator', actorId: 2, action: 'EventVerified',    targetType: 'Event',     targetId: 30768, detail: '內部查核',                   at: '2026-07-22T09:32:11Z', ip: '192.168.1.22' },
  { id: 3,  actorType: 'Operator', actorId: 2, action: 'ApplicationReviewed', targetType: 'Application', targetId: 1004, detail: '標準審核',              at: '2026-07-22T10:05:44Z', ip: '192.168.1.22' },
  { id: 4,  actorType: 'Operator', actorId: 3, action: 'RedemptionVerified', targetType: 'Redemption', targetId: 4002, detail: '核對成立',                at: '2026-07-22T10:18:07Z', ip: '192.168.1.35' },
  { id: 5,  actorType: 'Operator', actorId: 1, action: 'AccountUpdated',   targetType: 'Account',   targetId: 4,     detail: '人事異動',                   at: '2026-07-22T11:02:33Z', ip: '192.168.1.10' },
  { id: 6,  actorType: 'Operator', actorId: 1, action: 'ParameterUpdated', targetType: 'Parameter', targetId: 0,     detail: 'high_freq_count：安全政策',  at: '2026-07-22T11:45:19Z', ip: '192.168.1.10' },
  { id: 7,  actorType: 'Operator', actorId: 2, action: 'TicketResolved',   targetType: 'Ticket',    targetId: 2002,  detail: '調查核實',                   at: '2026-07-22T13:10:05Z', ip: '192.168.1.22' },
  { id: 8,  actorType: 'Operator', actorId: 3, action: 'EventTakenDown',   targetType: 'Event',     targetId: 30760, detail: '多方反饋',                   at: '2026-07-22T13:28:50Z', ip: '192.168.1.35' },
  { id: 9,  actorType: 'Operator', actorId: 1, action: 'AccountCreated',   targetType: 'Account',   targetId: 3,     detail: '人事異動',                   at: '2026-07-21T15:33:22Z', ip: '192.168.1.10' },
  { id: 10, actorType: 'Operator', actorId: 2, action: 'HotspotUpdated',   targetType: 'Hotspot',   targetId: 1,     detail: '實地勘測',                   at: '2026-07-21T16:00:01Z', ip: '192.168.1.22' },
  { id: 11, actorType: 'Operator', actorId: 3, action: 'RedemptionVerified', targetType: 'Redemption', targetId: 4003, detail: '核對成立',               at: '2026-07-21T16:44:17Z', ip: '192.168.1.35' },
  { id: 12, actorType: 'Operator', actorId: 1, action: 'ParameterUpdated', targetType: 'Parameter', targetId: 0,     detail: 'broadcast_radius_1：運營調整', at: '2026-07-21T17:05:40Z', ip: '192.168.1.10' },
  { id: 13, actorType: 'Operator', actorId: 2, action: 'ApplicationReviewed', targetType: 'Application', targetId: 1002, detail: '標準審核',             at: '2026-07-20T09:22:15Z', ip: '192.168.1.22' },
  { id: 14, actorType: 'Operator', actorId: 1, action: 'AccountDisabled',  targetType: 'Account',   targetId: 4,     detail: '安全考量',                   at: '2026-07-20T10:11:38Z', ip: '192.168.1.10' },
  { id: 15, actorType: 'Operator', actorId: 3, action: 'TicketResolved',   targetType: 'Ticket',    targetId: 2001,  detail: '規則判定',                   at: '2026-07-20T14:58:03Z', ip: '192.168.1.35' },
]

// ─────────────────────────────────────────────────────────────
// 12. Admin Accounts  GET /api/backend/accounts
//   role:   Admin | Operator
//   status: Active | Disabled
// ─────────────────────────────────────────────────────────────

/** GET /api/backend/accounts → BackendAccountItem[] */
export const MOCK_ACCOUNTS = [
  { id: 1, username: 'ADM-001', role: 'Admin',    status: 'Active',   lastLoginAt: '2026-07-24T09:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, username: 'ADM-002', role: 'Operator', status: 'Active',   lastLoginAt: '2026-07-24T08:30:00Z', createdAt: '2025-03-15T00:00:00Z' },
  { id: 3, username: 'ADM-003', role: 'Operator', status: 'Active',   lastLoginAt: '2026-07-23T17:00:00Z', createdAt: '2025-06-01T00:00:00Z' },
  { id: 4, username: 'ADM-004', role: 'Operator', status: 'Disabled', lastLoginAt: '2026-06-01T10:00:00Z', createdAt: '2025-08-10T00:00:00Z' },
]
