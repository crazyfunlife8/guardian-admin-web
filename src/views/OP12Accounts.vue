<template>
  <div class="op12-root">
    <OpsTopBar title="帳號權限與操作日誌（OP-12）" />

    <!-- 頁籤導航 -->
    <nav class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'perms' }"
        @click="activeTab = 'perms'"
      >
        權限管理
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'logs' }"
        @click="activeTab = 'logs'"
      >
        操作日誌
      </button>
    </nav>

    <!-- 頁籤內容區 -->
    <div class="tab-content">

      <!-- ① 權限管理（版型 C） -->
      <div v-show="activeTab === 'perms'" class="tab-pane perms-pane">
        <div class="perms-inner">

          <!-- 後台帳號 -->
          <InfoCard title="後台帳號">
            <div class="acc-list">
              <div v-for="acc in adminAccounts" :key="acc.id" class="acc-row-wrap">
                <!-- 帳號列 -->
                <div class="acc-row" :class="{ 'row-active': accEditingId === acc.id }">
                  <span class="mono acc-id">{{ acc.id }}</span>
                  <span class="acc-name">{{ acc.displayName }}</span>
                  <span class="role-chip" :class="`role-${acc.role}`">
                    {{ ROLE_LABELS[acc.role] }}
                  </span>
                  <span
                    class="status-dot"
                    :class="acc.status === 'active' ? 'dot-active' : 'dot-inactive'"
                    :title="acc.status === 'active' ? '啟用' : '停用'"
                  ></span>
                  <span class="status-text" :class="acc.status === 'active' ? 'text-ok' : 'text-dim'">
                    {{ acc.status === 'active' ? '啟用' : '停用' }}
                  </span>
                  <span class="created-at">加入 {{ acc.createdAt }}</span>
                  <button
                    v-if="accEditingId !== acc.id"
                    class="row-edit-btn"
                    @click="startAccEdit(acc)"
                  >編輯</button>
                  <button
                    v-else
                    class="row-cancel-btn"
                    @click="accEditingId = null"
                  >收合</button>
                </div>

                <!-- 內聯編輯表單 -->
                <div v-if="accEditingId === acc.id" class="inline-form">
                  <div class="form-row">
                    <label class="form-label">顯示名稱</label>
                    <input v-model="accDraft.displayName" class="form-input" type="text" />
                  </div>
                  <div class="form-row">
                    <label class="form-label">角色</label>
                    <select v-model="accDraft.role" class="form-select">
                      <option v-for="(lbl, key) in ROLE_LABELS" :key="key" :value="key">
                        {{ lbl }}
                      </option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label class="form-label">狀態</label>
                    <select v-model="accDraft.status" class="form-select">
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                  <div class="form-actions">
                    <button class="save-btn" @click="requestAccUpdate(acc.id)">儲存</button>
                    <button class="cancel-btn" @click="accEditingId = null">取消</button>
                  </div>
                </div>
              </div>

              <!-- 新增帳號區 -->
              <div v-if="!addingNew" class="add-account-row">
                <button class="add-acc-btn" @click="startAddNew">＋ 新增帳號</button>
              </div>
              <div v-else class="inline-form add-form">
                <div class="form-row">
                  <label class="form-label">帳號 ID</label>
                  <span class="mono auto-id-hint">自動產生</span>
                </div>
                <div class="form-row">
                  <label class="form-label">顯示名稱</label>
                  <input
                    v-model="newAccDraft.displayName"
                    class="form-input"
                    type="text"
                    placeholder="輸入顯示名稱"
                  />
                </div>
                <div class="form-row">
                  <label class="form-label">角色</label>
                  <select v-model="newAccDraft.role" class="form-select">
                    <option v-for="(lbl, key) in ROLE_LABELS" :key="key" :value="key">
                      {{ lbl }}
                    </option>
                  </select>
                </div>
                <div class="form-row">
                  <label class="form-label">初始密碼</label>
                  <div class="pw-wrap">
                    <input
                      v-model="newAccDraft.password"
                      class="form-input pw-input"
                      :type="showPw ? 'text' : 'password'"
                      placeholder="輸入初始密碼"
                    />
                    <button class="pw-toggle-btn" type="button" @click="showPw = !showPw">
                      {{ showPw ? '隱藏' : '顯示' }}
                    </button>
                  </div>
                </div>
                <div class="form-actions">
                  <button class="save-btn" @click="requestAccAdd">送出</button>
                  <button class="cancel-btn" @click="addingNew = false">取消</button>
                </div>
              </div>
            </div>
          </InfoCard>

          <!-- 角色設定 -->
          <InfoCard title="角色設定">
            <div class="role-list">
              <div v-for="role in roles" :key="role.key" class="role-row-wrap">
                <!-- 角色列 -->
                <div class="role-row" :class="{ 'row-active': roleEditingKey === role.key }">
                  <span class="role-name-text">{{ role.label }}</span>
                  <span
                    class="access-badge"
                    :class="role.accessLevel === 'restricted' ? 'badge-restrict' : 'badge-normal'"
                  >
                    {{ role.accessLevel === 'restricted' ? '高權限' : '一般' }}
                  </span>
                  <span class="page-count-hint">可存取 {{ role.pages.length }} 頁</span>
                  <button
                    v-if="roleEditingKey !== role.key"
                    class="row-edit-btn"
                    @click="startRoleEdit(role)"
                  >設定</button>
                  <button
                    v-else
                    class="row-cancel-btn"
                    @click="roleEditingKey = null"
                  >收合</button>
                </div>

                <!-- 內聯角色設定 -->
                <div v-if="roleEditingKey === role.key" class="inline-form role-edit-form">
                  <div class="form-row">
                    <label class="form-label">個資存取層級</label>
                    <div class="radio-group">
                      <label class="radio-opt">
                        <input v-model="roleDraft.accessLevel" type="radio" value="normal" />
                        一般
                      </label>
                      <label class="radio-opt">
                        <input v-model="roleDraft.accessLevel" type="radio" value="restricted" />
                        高權限
                      </label>
                    </div>
                  </div>
                  <div class="form-row pages-form-row">
                    <label class="form-label">可存取頁面</label>
                    <div class="page-checks">
                      <label
                        v-for="pg in ALL_PAGES"
                        :key="pg.key"
                        class="page-check-opt"
                      >
                        <input
                          type="checkbox"
                          :value="pg.key"
                          :checked="roleDraft.pages.includes(pg.key)"
                          @change="togglePage(pg.key)"
                        />
                        {{ pg.label }}
                      </label>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button class="save-btn" @click="requestRoleUpdate(role.key)">儲存</button>
                    <button class="cancel-btn" @click="roleEditingKey = null">取消</button>
                  </div>
                </div>
              </div>
            </div>
          </InfoCard>

        </div>
      </div>

      <!-- ② 操作日誌（版型 D） -->
      <div v-show="activeTab === 'logs'" class="tab-pane logs-pane">
        <div class="logs-inner">

          <!-- 篩選列 -->
          <div class="filter-bar">
            <input
              v-model="filterState.operatorId"
              type="text"
              class="filter-input id-input"
              placeholder="帳號 ID（如 ADM-001）"
            />
            <select v-model="filterState.actionType" class="filter-select">
              <option value="all">全部操作類型</option>
              <option v-for="t in ACTION_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
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
            <button class="clear-btn" @click="clearFilter">清除</button>
            <button class="export-btn" @click="exportCsv">匯出 CSV</button>
          </div>

          <!-- 結果摘要 -->
          <div class="result-summary">
            共 <b>{{ filteredLog.length }}</b> 筆記錄
          </div>

          <!-- 數據表 -->
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>操作者 ID</th>
                  <th>動作類型</th>
                  <th>對象</th>
                  <th>依據</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in filteredLog"
                  :key="row.id"
                  class="data-row"
                  :class="{ odd: i % 2 === 1 }"
                >
                  <td class="mono time-col">{{ row.time }}</td>
                  <td class="mono">{{ row.operatorId }}</td>
                  <td>
                    <span class="action-chip" :class="ACTION_CHIP_CLASS[row.actionType] ?? 'chip-secondary'">
                      {{ row.actionType }}
                    </span>
                  </td>
                  <td class="mono target-col">{{ row.target }}</td>
                  <td class="reason-col">{{ row.reason }}</td>
                  <td class="mono ip-col">{{ row.ip }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredLog.length === 0" class="empty-state">
              無符合條件的日誌記錄
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- 共用確認對話框 -->
    <ConfirmDialog
      v-if="dialog.open"
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      :reasons="dialog.reasons"
      :extra="dialog.extra"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup>
import { ref }           from 'vue'
import { storeToRefs }   from 'pinia'
import {
  useAccountsStore,
  ROLE_LABELS, ALL_PAGES, ACTION_TYPES, ACTION_CHIP_CLASS,
} from '../stores/accounts'
import { useToastStore } from '../stores/toast'
import OpsTopBar         from '../components/layout/OpsTopBar.vue'
import InfoCard          from '../components/shared/InfoCard.vue'
import ConfirmDialog     from '../components/shared/ConfirmDialog.vue'

const store = useAccountsStore()
const toast = useToastStore()
const { adminAccounts, roles, filterState, filteredLog } = storeToRefs(store)

const activeTab = ref('perms')

/* ── 帳號編輯 ── */
const accEditingId = ref(null)
const accDraft     = ref({ displayName: '', role: 'ops', status: 'active' })

function startAccEdit(acc) {
  addingNew.value    = false
  accEditingId.value = acc.id
  accDraft.value     = { displayName: acc.displayName, role: acc.role, status: acc.status }
}

/* ── 新增帳號 ── */
const addingNew    = ref(false)
const newAccDraft  = ref({ displayName: '', role: 'ops', password: '' })
const showPw       = ref(false)

function startAddNew() {
  accEditingId.value  = null
  addingNew.value     = true
  newAccDraft.value   = { displayName: '', role: 'ops', password: '' }
  showPw.value        = false
}

/* ── 角色設定 ── */
const roleEditingKey = ref(null)
const roleDraft      = ref({ accessLevel: 'normal', pages: [] })

function startRoleEdit(role) {
  roleEditingKey.value = role.key
  roleDraft.value      = { accessLevel: role.accessLevel, pages: [...role.pages] }
}

function togglePage(key) {
  const idx = roleDraft.value.pages.indexOf(key)
  if (idx === -1) roleDraft.value.pages.push(key)
  else roleDraft.value.pages.splice(idx, 1)
}

/* ── ConfirmDialog ── */
const pendingOp = ref(null)
const dialog    = ref({ open: false, title: '', body: '', reasons: [], extra: '' })

const ACC_REASONS = [
  { value: '人事異動', label: '人事異動' },
  { value: '運營需求', label: '運營需求' },
  { value: '安全考量', label: '安全考量' },
  { value: 'other',   label: '其他' },
]
const ROLE_REASONS = [
  { value: '職責調整', label: '職責調整' },
  { value: '安全政策', label: '安全政策' },
  { value: '主管授權', label: '主管授權' },
  { value: 'other',   label: '其他' },
]
const ROLE_WARN = '⚠ 角色設定變更將影響所有使用該角色的帳號存取權限，請確認已獲主管授權。'

function openDialog(op, opts) {
  pendingOp.value = op
  dialog.value    = { open: true, ...opts }
}

function requestAccUpdate(id) {
  if (!accDraft.value.displayName.trim()) { toast.info('顯示名稱不可為空'); return }
  openDialog(
    { type: 'acc-update', id, data: { ...accDraft.value } },
    { title: '確認修改帳號', body: `修改帳號 <b>${id}</b> 的設定（角色：${ROLE_LABELS[accDraft.value.role]}、狀態：${accDraft.value.status === 'active' ? '啟用' : '停用'}）`, reasons: ACC_REASONS, extra: '' },
  )
}

function requestAccAdd() {
  if (!newAccDraft.value.displayName.trim()) { toast.info('顯示名稱不可為空'); return }
  if (!newAccDraft.value.password.trim())    { toast.info('初始密碼不可為空'); return }
  openDialog(
    { type: 'acc-add', data: { ...newAccDraft.value } },
    { title: '確認新增帳號', body: `新增帳號「${newAccDraft.value.displayName}」，角色：${ROLE_LABELS[newAccDraft.value.role]}`, reasons: ACC_REASONS, extra: '' },
  )
}

function requestRoleUpdate(key) {
  if (roleDraft.value.pages.length === 0) { toast.info('至少需選取一個可存取頁面'); return }
  const roleLabel = roles.value.find(r => r.key === key)?.label ?? key
  openDialog(
    { type: 'role-update', key, data: { ...roleDraft.value, pages: [...roleDraft.value.pages] } },
    { title: '確認修改角色設定', body: `修改「${roleLabel}」的頁面存取權限與個資層級`, reasons: ROLE_REASONS, extra: ROLE_WARN },
  )
}

function onConfirm(reason) {
  if (!pendingOp.value) return
  const op = pendingOp.value
  switch (op.type) {
    case 'acc-update':
      store.updateAccount(op.id, { ...op.data, reason })
      toast.success(`已更新帳號 ${op.id}・已留跡`)
      accEditingId.value = null
      break
    case 'acc-add':
      store.addAccount({ ...op.data, reason })
      toast.success(`已新增帳號「${op.data.displayName}」・已留跡`)
      addingNew.value = false
      break
    case 'role-update': {
      const roleLabel = roles.value.find(r => r.key === op.key)?.label ?? op.key
      store.updateRole(op.key, { ...op.data, reason })
      toast.success(`已更新角色「${roleLabel}」設定・已留跡`)
      roleEditingKey.value = null
      break
    }
  }
  dialog.value.open = false
  pendingOp.value   = null
}

function onCancel() {
  dialog.value.open = false
  pendingOp.value   = null
}

/* ── 操作日誌篩選 & 匯出 ── */
function clearFilter() {
  store.setFilter('operatorId', '')
  store.setFilter('actionType', 'all')
  store.setFilter('dateFrom', '')
  store.setFilter('dateTo', '')
}

function exportCsv() {
  const cols = [
    { h: '時間',     k: 'time' },
    { h: '操作者ID', k: 'operatorId' },
    { h: '動作類型', k: 'actionType' },
    { h: '對象',     k: 'target' },
    { h: '依據',     k: 'reason' },
    { h: 'IP',       k: 'ip' },
  ]
  const header = cols.map(c => c.h).join(',')
  const body   = filteredLog.value.map(r =>
    cols.map(c => `"${r[c.k] ?? ''}"`).join(',')
  ).join('\n')
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `操作日誌_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<style scoped>
.op12-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 頁籤導航 ── */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 12px 16px 10px;
  cursor: pointer;
  transition: color .12s, border-color .12s;
}
.tab-btn:hover  { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

/* ── 頁籤內容區 ── */
.tab-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.tab-pane {
  position: absolute;
  inset: 0;
  overflow-y: auto;
}

/* ── 權限管理版型 C ── */
.perms-pane  { padding: 24px 32px; }
.perms-inner {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 帳號列表 ── */
.acc-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.acc-row-wrap {
  border-bottom: 1px solid var(--line);
}
.acc-row-wrap:last-of-type { border-bottom: none; }

.acc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  transition: background .1s;
}
.acc-row.row-active { background: rgba(76,154,255,.04); border-radius: 8px; padding: 12px 10px; }

.acc-id   { font-size: 13px; min-width: 70px; flex-shrink: 0; }
.acc-name { font-size: 14px; color: var(--text-primary); flex: 1; }

.role-chip {
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 7px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  color: var(--text-secondary);
}
.role-chip.role-admin  { color: var(--danger);  border-color: var(--danger); }
.role-chip.role-ops    { color: var(--accent);  border-color: var(--accent); }
.role-chip.role-viewer { color: var(--text-secondary); }

.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-active   { background: var(--ok); }
.dot-inactive { background: var(--text-secondary); }

.status-text { font-size: 12px; flex-shrink: 0; }
.text-ok  { color: var(--ok); }
.text-dim { color: var(--text-secondary); }

.created-at {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  flex-shrink: 0;
}

/* ── 角色列表 ── */
.role-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.role-row-wrap {
  border-bottom: 1px solid var(--line);
}
.role-row-wrap:last-child { border-bottom: none; }

.role-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
}
.role-row.row-active { background: rgba(76,154,255,.04); border-radius: 8px; padding: 13px 10px; }

.role-name-text { font-size: 14px; color: var(--text-primary); flex: 1; font-weight: 500; }

.access-badge {
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 7px;
  border: 1px solid transparent;
  flex-shrink: 0;
}
.badge-restrict { color: var(--danger); border-color: var(--danger); background: rgba(229,96,76,.08); }
.badge-normal   { color: var(--text-secondary); border-color: var(--line); }

.page-count-hint {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* ── 通用 row 操作按鈕 ── */
.row-edit-btn {
  background: none;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent);
  font-size: 12px;
  font-family: var(--sans);
  padding: 4px 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background .12s;
}
.row-edit-btn:hover { background: rgba(76,154,255,.1); }

.row-cancel-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-family: var(--sans);
  padding: 4px 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background .12s;
}
.row-cancel-btn:hover { background: var(--bg-panel); }

/* ── 內聯表單 ── */
.inline-form {
  background: var(--bg-panel);
  border-radius: 10px;
  padding: 16px 18px;
  margin: 4px 0 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--line);
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 100px;
  flex-shrink: 0;
  padding-top: 8px;
}

.form-input {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 7px 12px;
}
.form-input:focus { outline: 1px solid var(--accent); }

.form-select {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 7px 12px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.save-btn {
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: #08111F;
  font-size: 14px;
  font-family: var(--sans);
  font-weight: 600;
  padding: 8px 20px;
  cursor: pointer;
  transition: filter .12s;
}
.save-btn:hover { filter: brightness(1.1); }

.cancel-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--sans);
  padding: 8px 16px;
  cursor: pointer;
  transition: color .12s, background .12s;
}
.cancel-btn:hover { color: var(--text-primary); background: var(--bg-panel-raised); }

/* 密碼欄位 */
.pw-wrap {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
}
.pw-input { flex: 1; }
.pw-toggle-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-family: var(--sans);
  padding: 6px 10px;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
}
.pw-toggle-btn:hover { color: var(--text-primary); background: var(--bg-panel-raised); }

/* 自動 ID 提示 */
.auto-id-hint {
  font-size: 13px;
  color: var(--text-secondary);
  padding-top: 8px;
}

/* 新增帳號觸發列 */
.add-account-row {
  padding: 12px 0 4px;
}
.add-acc-btn {
  background: none;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 8px 16px;
  cursor: pointer;
  transition: color .12s, border-color .12s;
}
.add-acc-btn:hover { color: var(--accent); border-color: var(--accent); }

/* 角色設定表單 */
.role-edit-form { gap: 16px; }

.radio-group {
  display: flex;
  gap: 16px;
  padding-top: 6px;
}
.radio-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}
.radio-opt input { accent-color: var(--accent); }

.pages-form-row { align-items: flex-start; }

.page-checks {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
}
.page-check-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
  white-space: nowrap;
}
.page-check-opt input { accent-color: var(--accent); }

/* ── 操作日誌版型 D ── */
.logs-pane { padding: 0; }
.logs-inner {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  box-sizing: border-box;
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
.id-input   { width: 180px; font-family: var(--mono); }
.date-input { width: 142px; }
.date-input::-webkit-calendar-picker-indicator { filter: invert(.5); cursor: pointer; }

.date-range { display: flex; align-items: center; gap: 6px; }
.date-sep   { color: var(--text-secondary); font-size: 13px; }

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
.result-summary { font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
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
  padding: 8px 12px 8px 0;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.data-row td {
  padding: 11px 12px 11px 0;
  border-bottom: 1px solid rgba(42,53,71,.3);
  vertical-align: middle;
  color: var(--text-primary);
}
.data-row.odd { background: rgba(255,255,255,.02); }
.data-row:hover { background: var(--bg-panel-raised); }

.mono      { font-family: var(--mono); }
.time-col  { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
.target-col { font-size: 13px; }
.reason-col { font-size: 13px; color: var(--text-secondary); }
.ip-col     { font-size: 12px; color: var(--text-secondary); }

/* 動作類型 chip */
.action-chip {
  display: inline-block;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 7px;
  border: 1px solid var(--line);
  white-space: nowrap;
}
.chip-warn      { color: var(--warn);   border-color: var(--warn);   background: rgba(255,185,46,.08); }
.chip-danger    { color: var(--danger); border-color: var(--danger); background: rgba(229,96,76,.08); }
.chip-info      { color: var(--info);   border-color: var(--info);   background: rgba(64,169,255,.08); }
.chip-accent    { color: var(--accent); border-color: var(--accent); background: rgba(76,154,255,.08); }
.chip-ok        { color: var(--ok);     border-color: var(--ok);     background: rgba(82,196,112,.08); }
.chip-secondary { color: var(--text-secondary); border-color: var(--line); }

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
