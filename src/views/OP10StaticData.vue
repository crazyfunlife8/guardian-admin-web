<template>
  <div class="op10-root">
    <OpsTopBar title="靜態資料管理（OP-10）" />

    <div class="content">

      <!-- ① 熱點區域 ─────────────────────────────────────────── -->
      <InfoCard title="熱點區域">
        <div class="item-list">
          <div v-for="hs in store.hotspots" :key="hs.id" class="item-row">
            <!-- 顯示態 -->
            <template v-if="hsEditingId !== hs.id">
              <div class="item-info">
                <span class="item-id mono">{{ hs.id }}</span>
                <span class="item-name">{{ hs.name }}</span>
                <span class="item-sub mono">({{ hs.lat }}, {{ hs.lng }})</span>
              </div>
              <div class="item-btns">
                <button class="row-btn" :disabled="hsAddingNew || hsEditingId !== null" @click="startHsEdit(hs)">編輯</button>
                <button class="row-btn danger" :disabled="hsAddingNew || hsEditingId !== null" @click="requestHsDelete(hs)">刪除</button>
              </div>
            </template>
            <!-- 編輯態 -->
            <div v-else class="item-form">
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="hsDraft.name" class="form-input" placeholder="如：環狀線站周邊" />
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="hsDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="hsDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestHsUpdate(hs.id)">儲存</button>
                <button class="row-btn" @click="hsEditingId = null">取消</button>
              </div>
            </div>
          </div>

          <!-- 新增表單 -->
          <div v-if="hsAddingNew" class="item-row add-row">
            <div class="item-form">
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="hsDraft.name" class="form-input" placeholder="如：環狀線站周邊" />
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="hsDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="hsDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestHsAdd">儲存</button>
                <button class="row-btn" @click="hsAddingNew = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button
            v-if="!hsAddingNew && hsEditingId === null"
            class="add-btn"
            @click="startHsAdd"
          >＋ 新增熱點</button>
          <button class="text-btn" @click="hsMapOpen = !hsMapOpen">
            {{ hsMapOpen ? '隱藏地圖預覽 ▲' : '顯示地圖預覽 ▼' }}
          </button>
        </div>
        <div v-if="hsMapOpen" class="map-placeholder">
          <span class="map-hint">地圖預覽（串接 Google Maps 後啟用）</span>
        </div>
      </InfoCard>

      <!-- ② 合作來源主檔（PRD C4）────────────────────────────── -->
      <InfoCard title="合作來源主檔">
        <p class="section-desc">D5 人工事件登錄時引用此主檔選來源，授權範圍自動帶入，不逐筆填寫。</p>
        <div class="item-list">
          <div v-for="sm in store.sourceMasters" :key="sm.id" class="item-row" :class="{ 'deleted-row': sm.deleted }">
            <!-- 顯示態 -->
            <template v-if="smEditingId !== sm.id">
              <div class="item-info sm-info">
                <span class="item-id mono">{{ sm.id }}</span>
                <span class="item-name" :class="{ 'deleted-name': sm.deleted }">{{ sm.name }}</span>
                <span v-if="sm.deleted" class="item-badge badge-dim">已停用</span>
                <div v-else class="scope-chips">
                  <span v-for="sc in sm.scopes" :key="sc" class="scope-chip">
                    {{ SCOPE_LABELS[sc] }}
                  </span>
                </div>
                <span v-if="!sm.deleted" class="sm-purpose">{{ sm.purpose }}</span>
              </div>
              <div class="item-btns">
                <template v-if="sm.deleted">
                  <button class="row-btn ok" :disabled="smAddingNew || smEditingId !== null" @click="requestSmEnable(sm)">啟用</button>
                </template>
                <template v-else>
                  <button class="row-btn" :disabled="smAddingNew || smEditingId !== null" @click="startSmEdit(sm)">編輯</button>
                  <button class="row-btn danger" :disabled="smAddingNew || smEditingId !== null" @click="requestSmDelete(sm)">停用</button>
                </template>
              </div>
            </template>
            <!-- 編輯態 -->
            <div v-else class="item-form">
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="smDraft.name" class="form-input" placeholder="來源名稱" />
              </div>
              <div class="form-row scope-row">
                <label class="form-label">授權範圍</label>
                <div class="scope-checks">
                  <label v-for="opt in SCOPE_OPTIONS" :key="opt.value" class="scope-check-label">
                    <input type="checkbox" :value="opt.value" v-model="smDraft.scopes" class="scope-checkbox" />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label">可用用途</label>
                <input v-model="smDraft.purpose" class="form-input" placeholder="說明此來源的用途" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestSmUpdate(sm.id)">儲存</button>
                <button class="row-btn" @click="smEditingId = null">取消</button>
              </div>
            </div>
          </div>

          <!-- 新增表單 -->
          <div v-if="smAddingNew" class="item-row add-row">
            <div class="item-form">
              <div class="form-row">
                <label class="form-label">來源代碼</label>
                <input v-model="smDraft.sourceKey" class="form-input" placeholder="英文唯一代碼，例：tdx（建立後不可更改）" />
              </div>
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="smDraft.name" class="form-input" placeholder="來源名稱" />
              </div>
              <div class="form-row scope-row">
                <label class="form-label">授權範圍</label>
                <div class="scope-checks">
                  <label v-for="opt in SCOPE_OPTIONS" :key="opt.value" class="scope-check-label">
                    <input type="checkbox" :value="opt.value" v-model="smDraft.scopes" class="scope-checkbox" />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
              <div class="form-row">
                <label class="form-label">可用用途</label>
                <input v-model="smDraft.purpose" class="form-input" placeholder="說明此來源的用途（必填）" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestSmAdd">儲存</button>
                <button class="row-btn" @click="smAddingNew = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button
            v-if="!smAddingNew && smEditingId === null"
            class="add-btn"
            @click="startSmAdd"
          >＋ 新增來源</button>
        </div>
      </InfoCard>

      <!-- ③ 覆蓋區域 ──────────────────────────────────────────── -->
      <InfoCard title="覆蓋區域">
        <p class="section-desc">定義服務範圍內的行政分區多邊形（GeoJSON），供使用者選擇偏好區域時參照。</p>
        <div class="item-list">
          <div v-for="ca in store.coverageAreas" :key="ca.id" class="item-row">
            <!-- 顯示態 -->
            <template v-if="caEditingId !== ca.id">
              <div class="item-info">
                <span class="item-id mono">{{ ca.id }}</span>
                <span class="item-name">{{ ca.name || '（未命名）' }}</span>
                <span v-if="ca.coverageLevel" class="item-badge">{{ ca.coverageLevel }}</span>
                <span class="item-sub">{{ ca.createdAt }}</span>
              </div>
              <div class="item-btns">
                <button class="row-btn" :disabled="caAddingNew || caEditingId !== null" @click="startCaEdit(ca)">編輯</button>
                <button class="row-btn danger" :disabled="caAddingNew || caEditingId !== null" @click="requestCaDelete(ca)">刪除</button>
              </div>
            </template>
            <!-- 編輯態 -->
            <div v-else class="item-form">
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="caDraft.name" class="form-input" placeholder="如：臺北市" />
              </div>
              <div class="form-row">
                <label class="form-label">等級</label>
                <input v-model="caDraft.coverageLevel" class="form-input" placeholder="如：city / district" />
              </div>
              <div class="form-row ca-geo-row">
                <label class="form-label">幾何</label>
                <div class="ca-geo-wrap">
                  <textarea v-model="caDraft.geometry" class="boundary-textarea ca-textarea" rows="6" spellcheck="false" placeholder='{"type":"Polygon","coordinates":[...]}' />
                  <p v-if="caError" class="form-error">{{ caError }}</p>
                </div>
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestCaUpdate(ca.id)">儲存</button>
                <button class="row-btn" @click="cancelCaEdit">取消</button>
              </div>
            </div>
          </div>

          <!-- 新增表單 -->
          <div v-if="caAddingNew" class="item-row add-row">
            <div class="item-form">
              <div class="form-row">
                <label class="form-label">名稱</label>
                <input v-model="caDraft.name" class="form-input" placeholder="如：臺北市" />
              </div>
              <div class="form-row">
                <label class="form-label">等級</label>
                <input v-model="caDraft.coverageLevel" class="form-input" placeholder="如：city / district" />
              </div>
              <div class="form-row ca-geo-row">
                <label class="form-label">幾何 <span style="color:var(--danger)">*</span></label>
                <div class="ca-geo-wrap">
                  <textarea v-model="caDraft.geometry" class="boundary-textarea ca-textarea" rows="6" spellcheck="false" placeholder='{"type":"Polygon","coordinates":[...]}' />
                  <label class="row-btn upload-label" style="margin-top:6px;display:inline-block">
                    上傳 GeoJSON
                    <input type="file" accept=".json,.geojson" class="file-hidden" @change="onCaFileUpload" />
                  </label>
                  <p v-if="caError" class="form-error">{{ caError }}</p>
                </div>
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestCaAdd">儲存</button>
                <button class="row-btn" @click="caAddingNew = false; caError = ''">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button
            v-if="!caAddingNew && caEditingId === null"
            class="add-btn"
            @click="startCaAdd"
          >＋ 新增區域</button>
        </div>
      </InfoCard>

      <!-- ④ 兌換品項管理 ───────────────────────────────────────── -->
      <InfoCard title="兌換品項管理">
        <p class="section-desc">管理兌換中心可兌換的品項及積分費率，上架品項將顯示於兌換中心供情報員選擇。</p>
        <div class="item-list">
          <div v-for="ri in store.redemptionItems" :key="ri.id" class="item-row">
            <!-- 顯示態 -->
            <template v-if="riEditingId !== ri.id">
              <div class="item-info ri-info">
                <span class="item-id mono">{{ ri.id }}</span>
                <span class="item-name">{{ ri.name }}</span>
                <span class="ri-rate mono">{{ ri.pointsRequired }} 積分 → NT${{ ri.cashValue }}</span>
                <span class="item-badge" :class="ri.enabled ? 'badge-ok' : 'badge-dim'">
                  {{ ri.enabled ? '上架中' : '已下架' }}
                </span>
                <span v-if="ri.description" class="ri-desc">{{ ri.description }}</span>
              </div>
              <div class="item-btns">
                <button class="row-btn" :disabled="riAddingNew || riEditingId !== null" @click="startRiEdit(ri)">編輯</button>
                <button class="row-btn danger" :disabled="riAddingNew || riEditingId !== null" @click="requestRiDelete(ri)">刪除</button>
              </div>
            </template>
            <!-- 編輯態 -->
            <div v-else class="item-form">
              <div class="form-row">
                <label class="form-label">名稱 <span style="color:var(--danger)">*</span></label>
                <input v-model="riDraft.name" class="form-input" placeholder="如：現金回饋 NT$100" />
              </div>
              <div class="form-row">
                <label class="form-label">所需積分 <span style="color:var(--danger)">*</span></label>
                <input v-model.number="riDraft.pointsRequired" type="number" min="1" class="form-input short mono" />
                <label class="form-label ml">現金價值（元）<span style="color:var(--danger)">*</span></label>
                <input v-model.number="riDraft.cashValue" type="number" min="1" class="form-input short mono" />
              </div>
              <div class="form-row">
                <label class="form-label">排列順序</label>
                <input v-model.number="riDraft.sortOrder" type="number" min="0" class="form-input short mono" placeholder="0" />
                <label class="form-label ml ri-enabled-label">
                  <input type="checkbox" v-model="riDraft.enabled" class="scope-checkbox" />
                  上架中
                </label>
              </div>
              <div class="form-row">
                <label class="form-label">說明</label>
                <input v-model="riDraft.description" class="form-input" placeholder="選填備註" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestRiUpdate(ri.id)">儲存</button>
                <button class="row-btn" @click="riEditingId = null">取消</button>
              </div>
            </div>
          </div>

          <!-- 新增表單 -->
          <div v-if="riAddingNew" class="item-row add-row">
            <div class="item-form">
              <div class="form-row">
                <label class="form-label">名稱 <span style="color:var(--danger)">*</span></label>
                <input v-model="riDraft.name" class="form-input" placeholder="如：現金回饋 NT$100" />
              </div>
              <div class="form-row">
                <label class="form-label">所需積分 <span style="color:var(--danger)">*</span></label>
                <input v-model.number="riDraft.pointsRequired" type="number" min="1" class="form-input short mono" />
                <label class="form-label ml">現金價值（元）<span style="color:var(--danger)">*</span></label>
                <input v-model.number="riDraft.cashValue" type="number" min="1" class="form-input short mono" />
              </div>
              <div class="form-row">
                <label class="form-label">排列順序</label>
                <input v-model.number="riDraft.sortOrder" type="number" min="0" class="form-input short mono" placeholder="0" />
                <label class="form-label ml ri-enabled-label">
                  <input type="checkbox" v-model="riDraft.enabled" class="scope-checkbox" />
                  上架中
                </label>
              </div>
              <div class="form-row">
                <label class="form-label">說明</label>
                <input v-model="riDraft.description" class="form-input" placeholder="選填備註" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestRiAdd">儲存</button>
                <button class="row-btn" @click="riAddingNew = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button
            v-if="!riAddingNew && riEditingId === null"
            class="add-btn"
            @click="startRiAdd"
          >＋ 新增兌換品項</button>
        </div>
      </InfoCard>

      <InfoCard title="服務區域邊界">
        <p class="section-desc">全台服務範圍 GeoJSON 多邊形邊界；變更後立即影響任務廣播範圍計算。</p>

        <template v-if="!boundaryEditing">
          <pre class="boundary-code">{{ boundaryPreview }}</pre>
          <button v-if="!boundaryExpanded" class="text-btn expand-btn" @click="boundaryExpanded = true">展開完整 JSON ▼</button>
          <button v-else class="text-btn expand-btn" @click="boundaryExpanded = false">收合 ▲</button>

          <div class="card-footer">
            <button class="row-btn" @click="startBoundaryEdit">直接編輯</button>
            <label class="row-btn upload-label">
              上傳 GeoJSON 檔
              <input type="file" accept=".json,.geojson" class="file-hidden" @change="onBoundaryFileUpload" />
            </label>
          </div>
        </template>

        <template v-else>
          <p v-if="boundaryError" class="form-error">{{ boundaryError }}</p>
          <textarea v-model="boundaryDraft" class="boundary-textarea" rows="10" spellcheck="false" />
          <div class="form-actions">
            <button class="row-btn ok" @click="requestBoundaryUpdate">儲存</button>
            <button class="row-btn" @click="cancelBoundaryEdit">取消</button>
          </div>
        </template>
      </InfoCard>

    </div><!-- /content -->

    <!-- 全頁共用對話框 -->
    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :body="dialog.body"
      :extra="dialog.extra"
      :reasons="dialog.reasons"
      @confirm="onConfirm"
      @cancel="dialog.open = false"
    />

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStaticDataStore, SCOPE_OPTIONS } from '../stores/staticData'
import { useToastStore }                     from '../stores/toast'
import OpsTopBar     from '../components/layout/OpsTopBar.vue'
import InfoCard      from '../components/shared/InfoCard.vue'
import ConfirmDialog from '../components/shared/ConfirmDialog.vue'
import Toast         from '../components/shared/Toast.vue'

const store = useStaticDataStore()
const toast = useToastStore()

onMounted(() => { store.loadHotspots(); store.loadSources(); store.loadCoverageAreas(); store.loadRedemptionItems(); store.loadBoundary() })

// ── 操作依據選項 ─────────────────────────────────────────────
const DATA_REASONS = [
  { value: 'internal',    label: '內部調整' },
  { value: 'operational', label: '運營需求' },
  { value: 'survey',      label: '實地勘測' },
  { value: 'other',       label: '其他' },
]
const BOUNDARY_REASONS = [
  { value: 'expansion',   label: '區域調整' },
  { value: 'regulation',  label: '行政規定' },
  { value: 'survey',      label: '勘測更新' },
  { value: 'other',       label: '其他' },
]
const BOUNDARY_WARN = '⚠ 邊界變更將立即影響任務廣播範圍，請確認新邊界數據正確無誤。'

// ── 共用對話框 ────────────────────────────────────────────────
const pendingOp = ref(null)
const dialog    = ref({ open: false, title: '', body: '', extra: '', reasons: DATA_REASONS })

function openDialog({ title, body, extra = '', reasons = DATA_REASONS }) {
  dialog.value = { open: true, title, body, extra, reasons }
}

function onConfirm(reason) {
  if (!pendingOp.value) return
  const op = pendingOp.value

  switch (op.type) {
    case 'hs-add':
      store.addHotspot(op.data)
      toast.success(`已新增熱點「${op.data.name}」・已留跡`)
      hsAddingNew.value = false
      break
    case 'hs-update':
      store.updateHotspot(op.id, op.data)
      toast.success(`已更新熱點「${op.data.name}」・已留跡`)
      hsEditingId.value = null
      break
    case 'hs-delete':
      store.deleteHotspot(op.id)
      toast.success(`已刪除熱點「${op.name}」・已留跡`)
      break
    case 'sm-add':
      store.addSource(op.data)
      toast.success(`已新增合作來源「${op.data.name}」・已留跡`)
      smAddingNew.value = false
      break
    case 'sm-update':
      store.updateSource(op.id, op.data)
      toast.success(`已更新合作來源「${op.data.name}」・已留跡`)
      smEditingId.value = null
      break
    case 'sm-delete':
      store.deleteSource(op.id)
      toast.success(`已停用合作來源「${op.name}」・已留跡`)
      break
    case 'sm-enable':
      store.enableSource(op.id)
      toast.success(`已啟用合作來源「${op.name}」・已留跡`)
      break
    case 'ri-add':
      store.addRedemptionItem(op.data)
        .then(() => { toast.success(`已新增兌換品項「${op.data.name}」・已留跡`); riAddingNew.value = false })
        .catch(() => toast.error('新增失敗，請稍後重試'))
      break
    case 'ri-update':
      store.updateRedemptionItem(op.id, op.data)
        .then(() => { toast.success(`已更新兌換品項「${op.data.name}」・已留跡`); riEditingId.value = null })
        .catch(() => toast.error('更新失敗，請稍後重試'))
      break
    case 'ri-delete':
      store.deleteRedemptionItem(op.id)
        .then(() => toast.success(`已刪除兌換品項「${op.name}」・已留跡`))
        .catch(() => toast.error('刪除失敗，請稍後重試'))
      break
    case 'ca-add':
      store.addCoverageArea(op.data)
        .then(() => { toast.success(`已新增覆蓋區域「${op.data.name || '未命名'}」・已留跡`); caAddingNew.value = false; caError.value = '' })
        .catch(() => toast.error('新增失敗，請稍後重試'))
      break
    case 'ca-update':
      store.updateCoverageArea(op.id, op.data)
        .then(() => { toast.success(`已更新覆蓋區域「${op.data.name || '未命名'}」・已留跡`); caEditingId.value = null; caError.value = '' })
        .catch(() => toast.error('更新失敗，請稍後重試'))
      break
    case 'ca-delete':
      store.deleteCoverageArea(op.id)
        .then(() => toast.success(`已刪除覆蓋區域「${op.name}」・已留跡`))
        .catch(() => toast.error('刪除失敗，請稍後重試'))
      break
    case 'boundary-update':
      store.updateBoundary(op.geojson)
        .then(() => toast.success('已更新服務區域邊界・已留跡'))
        .catch(() => toast.error('更新失敗，請稍後重試'))
      boundaryEditing.value = false
      break
  }

  dialog.value.open = false
  pendingOp.value = null
}

// ── § 熱點區域 ─────────────────────────────────────────────
const hsEditingId = ref(null)
const hsAddingNew = ref(false)
const hsDraft     = ref({ name: '', lat: 25.0, lng: 121.5 })
const hsMapOpen   = ref(false)

function startHsEdit(hs) {
  hsAddingNew.value = false
  hsEditingId.value = hs.id
  hsDraft.value = { name: hs.name, lat: hs.lat, lng: hs.lng, enabled: hs.enabled }
}

function startHsAdd() {
  hsEditingId.value = null
  hsAddingNew.value = true
  hsDraft.value = { name: '', lat: 25.0, lng: 121.5 }
}

function requestHsUpdate(id) {
  if (!hsDraft.value.name.trim()) return
  const d = { ...hsDraft.value }
  pendingOp.value = { type: 'hs-update', id, data: d }
  openDialog({
    title: `確認更新熱點「${d.name}」？`,
    body:  `座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>`,
    reasons: DATA_REASONS,
  })
}

function requestHsAdd() {
  if (!hsDraft.value.name.trim()) return
  const d = { ...hsDraft.value }
  pendingOp.value = { type: 'hs-add', data: d }
  openDialog({
    title: `確認新增熱點「${d.name}」？`,
    body:  `座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>`,
    reasons: DATA_REASONS,
  })
}

function requestHsDelete(hs) {
  pendingOp.value = { type: 'hs-delete', id: hs.id, name: hs.name }
  openDialog({
    title: `確認刪除熱點「${hs.name}」？`,
    body:  '此操作將移除此熱點，相關廣播設定將不再涵蓋此區域。',
    reasons: DATA_REASONS,
  })
}

// ── § 合作來源主檔 ─────────────────────────────────────────
const SCOPE_LABELS = Object.fromEntries(SCOPE_OPTIONS.map(o => [o.value, o.label]))

const smEditingId = ref(null)
const smAddingNew = ref(false)
const smDraft     = ref({ name: '', scopes: [], purpose: '' })

function startSmEdit(sm) {
  smAddingNew.value = false
  smEditingId.value = sm.id
  smDraft.value = { name: sm.name, scopes: [...sm.scopes], purpose: sm.purpose }
}

function startSmAdd() {
  smEditingId.value = null
  smAddingNew.value = true
  smDraft.value = { name: '', scopes: [], purpose: '', sourceKey: '' }
}

function requestSmUpdate(id) {
  if (!smDraft.value.name.trim() || !smDraft.value.purpose.trim()) return
  const d = { ...smDraft.value, scopes: [...smDraft.value.scopes] }
  pendingOp.value = { type: 'sm-update', id, data: d }
  openDialog({
    title: `確認更新合作來源「${d.name}」？`,
    body:  `授權範圍：<b>${d.scopes.map(s => SCOPE_LABELS[s]).join('、') || '（無）'}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestSmAdd() {
  if (!smDraft.value.name.trim() || !smDraft.value.purpose.trim() || !smDraft.value.sourceKey.trim()) return
  const d = { ...smDraft.value, scopes: [...smDraft.value.scopes] }
  pendingOp.value = { type: 'sm-add', data: d }
  openDialog({
    title: `確認新增合作來源「${d.name}」？`,
    body:  `授權範圍：<b>${d.scopes.map(s => SCOPE_LABELS[s]).join('、') || '（無）'}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestSmDelete(sm) {
  pendingOp.value = { type: 'sm-delete', id: sm.id, name: sm.name }
  openDialog({
    title: `確認停用合作來源「${sm.name}」？`,
    body:  '停用後 D5 登錄時將無法選此來源，可日後重新啟用。',
    reasons: DATA_REASONS,
  })
}

function requestSmEnable(sm) {
  pendingOp.value = { type: 'sm-enable', id: sm.id, name: sm.name }
  openDialog({
    title: `確認重新啟用合作來源「${sm.name}」？`,
    body:  '啟用後 D5 登錄時可再次選用此來源。',
    reasons: DATA_REASONS,
  })
}

// ── § 兌換品項管理 ──────────────────────────────────────────
const riEditingId = ref(null)
const riAddingNew = ref(false)
const riDraft     = ref({ name: '', pointsRequired: null, cashValue: null, description: '', sortOrder: 0, enabled: true })

function startRiEdit(ri) {
  riAddingNew.value = false
  riEditingId.value = ri.id
  riDraft.value = { name: ri.name, pointsRequired: ri.pointsRequired, cashValue: ri.cashValue, description: ri.description, sortOrder: ri.sortOrder, enabled: ri.enabled }
}

function startRiAdd() {
  riEditingId.value = null
  riAddingNew.value = true
  riDraft.value = { name: '', pointsRequired: null, cashValue: null, description: '', sortOrder: 0, enabled: true }
}

function _riValid() {
  return riDraft.value.name.trim() && riDraft.value.pointsRequired > 0 && riDraft.value.cashValue > 0
}

function requestRiUpdate(id) {
  if (!_riValid()) return
  const d = { ...riDraft.value }
  pendingOp.value = { type: 'ri-update', id, data: d }
  openDialog({
    title:   `確認更新兌換品項「${d.name}」？`,
    body:    `費率：<b>${d.pointsRequired} 積分 → NT$${d.cashValue}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestRiAdd() {
  if (!_riValid()) return
  const d = { ...riDraft.value }
  pendingOp.value = { type: 'ri-add', data: d }
  openDialog({
    title:   `確認新增兌換品項「${d.name}」？`,
    body:    `費率：<b>${d.pointsRequired} 積分 → NT$${d.cashValue}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestRiDelete(ri) {
  pendingOp.value = { type: 'ri-delete', id: ri.id, name: ri.name }
  openDialog({
    title:   `確認刪除兌換品項「${ri.name}」？`,
    body:    '刪除後此品項將從兌換中心移除，此操作無法復原。',
    reasons: DATA_REASONS,
  })
}

// ── § 覆蓋區域 ─────────────────────────────────────────────
const caEditingId = ref(null)
const caAddingNew = ref(false)
const caError     = ref('')
const caDraft     = ref({ name: '', coverageLevel: '', geometry: '' })

function startCaEdit(ca) {
  caAddingNew.value = false
  caEditingId.value = ca.id
  caError.value     = ''
  caDraft.value = {
    name:          ca.name ?? '',
    coverageLevel: ca.coverageLevel ?? '',
    geometry:      ca.geometry ? JSON.stringify(ca.geometry, null, 2) : '',
  }
}

function startCaAdd() {
  caEditingId.value = null
  caAddingNew.value = true
  caError.value     = ''
  caDraft.value     = { name: '', coverageLevel: '', geometry: '' }
}

function cancelCaEdit() {
  caEditingId.value = null
  caError.value     = ''
}

function parseCaGeometry() {
  const raw = caDraft.value.geometry.trim()
  if (!raw) { caError.value = '幾何（GeoJSON）為必填欄位'; return null }
  try { return JSON.parse(raw) } catch { caError.value = 'GeoJSON 格式錯誤，請重新檢查 JSON 語法。'; return null }
}

function requestCaUpdate(id) {
  const geometry = parseCaGeometry()
  if (!geometry) return
  caError.value = ''
  const d = { name: caDraft.value.name || null, coverageLevel: caDraft.value.coverageLevel || null, geometry }
  pendingOp.value = { type: 'ca-update', id, data: d }
  openDialog({
    title:   `確認更新覆蓋區域「${d.name || '未命名'}」？`,
    body:    `等級：<b>${d.coverageLevel || '（未設定）'}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestCaAdd() {
  const geometry = parseCaGeometry()
  if (!geometry) return
  caError.value = ''
  const d = { name: caDraft.value.name || null, coverageLevel: caDraft.value.coverageLevel || null, geometry }
  pendingOp.value = { type: 'ca-add', data: d }
  openDialog({
    title:   `確認新增覆蓋區域「${d.name || '未命名'}」？`,
    body:    `等級：<b>${d.coverageLevel || '（未設定）'}</b>`,
    reasons: DATA_REASONS,
  })
}

function requestCaDelete(ca) {
  pendingOp.value = { type: 'ca-delete', id: ca.id, name: ca.name || '未命名' }
  openDialog({
    title:   `確認刪除覆蓋區域「${ca.name || '未命名'}」？`,
    body:    '刪除後此區域將從使用者選擇清單中移除，此操作無法復原。',
    reasons: DATA_REASONS,
  })
}

function onCaFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    caDraft.value.geometry = evt.target.result
    caError.value = ''
    e.target.value = ''
  }
  reader.readAsText(file)
}

// ── § 服務區域邊界 ─────────────────────────────────────────
const boundaryEditing  = ref(false)
const boundaryDraft    = ref('')
const boundaryExpanded = ref(false)
const boundaryError    = ref('')

const boundaryPreview = computed(() => {
  const lines = store.serviceBoundary.split('\n')
  if (boundaryExpanded.value || lines.length <= 6) return store.serviceBoundary
  return lines.slice(0, 6).join('\n') + `\n  …（共 ${lines.length} 行）`
})

function startBoundaryEdit() {
  boundaryEditing.value = true
  boundaryDraft.value   = store.serviceBoundary
  boundaryError.value   = ''
}

function cancelBoundaryEdit() {
  boundaryEditing.value = false
  boundaryError.value   = ''
}

function onBoundaryFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    boundaryDraft.value   = evt.target.result
    boundaryEditing.value = true
    boundaryError.value   = ''
    e.target.value = ''
  }
  reader.readAsText(file)
}

function requestBoundaryUpdate() {
  const geojson = boundaryDraft.value.trim()
  if (!geojson) return
  try {
    JSON.parse(geojson)
  } catch {
    boundaryError.value = 'GeoJSON 格式錯誤，請重新檢查 JSON 語法。'
    return
  }
  boundaryError.value = ''
  pendingOp.value = { type: 'boundary-update', geojson }
  openDialog({
    title:   '確認更新服務區域邊界？',
    body:    '邊界資料將立即更新，影響任務廣播範圍計算。',
    extra:   BOUNDARY_WARN,
    reasons: BOUNDARY_REASONS,
  })
}
</script>

<style scoped>
.op10-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
}

/* ── 通用列表 ── */
.item-list {
  display: grid;
  gap: 2px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(42, 53, 71, .4);
}
.item-row:last-child { border-bottom: none; }
.item-row.add-row { border-top: 1px dashed var(--accent); padding-top: 14px; margin-top: 4px; }

.item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.item-id   { font-family: var(--mono); font-size: 11px; color: var(--text-secondary); min-width: 60px; }
.item-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.item-sub  { font-family: var(--mono); font-size: 12px; color: var(--text-secondary); }
.item-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-base);
  border: 1px solid var(--line);
  color: var(--text-secondary);
}
.item-badge.badge-ok  { color: var(--ok);  border-color: var(--ok); }
.item-badge.badge-dim { color: var(--text-secondary); }

.item-btns { display: flex; gap: 6px; flex-shrink: 0; }

/* 通用按鈕 */
.row-btn {
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 12px;
  font-family: var(--sans);
  transition: color .12s, border-color .12s;
  white-space: nowrap;
}
.row-btn:hover:not(:disabled)          { color: var(--accent);  border-color: var(--accent); }
.row-btn.danger:hover:not(:disabled)   { color: var(--danger);  border-color: var(--danger); }
.row-btn.ok                            { color: var(--ok);      border-color: var(--ok); }
.row-btn.ok:hover:not(:disabled)       { background: rgba(63,183,126,.1); }
.row-btn:disabled                      { opacity: .35; cursor: not-allowed; }
.row-btn.upload-label                  { display: inline-block; cursor: pointer; }

/* 表單 */
.item-form {
  width: 100%;
  display: grid;
  gap: 10px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.form-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 28px;
}
.form-label.ml { margin-left: 8px; }

.form-input {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 5px 10px;
  height: 30px;
  outline: none;
  transition: border-color .12s;
  flex: 1;
  min-width: 120px;
}
.form-input:focus { border-color: var(--accent); }
.form-input.short { flex: none; width: 110px; }
.form-input.mono  { font-family: var(--mono); }

.unit-text { font-size: 12px; color: var(--text-secondary); }

.form-actions { display: flex; gap: 6px; }

/* 頁尾 / 地圖 */
.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(42,53,71,.4);
}

.add-btn {
  font-size: 13px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 14px;
  font-family: var(--sans);
  transition: color .12s, border-color .12s;
}
.add-btn:hover { color: var(--accent); border-color: var(--accent); }

.text-btn {
  font-size: 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  padding: 0;
  transition: color .12s;
}
.text-btn:hover { color: var(--accent); }
.text-btn.expand-btn { margin-top: 6px; display: block; }

.map-placeholder {
  margin-top: 12px;
  height: 160px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.02);
}
.map-hint { font-size: 13px; color: var(--text-secondary); }

/* ── § 合作來源主檔 ── */
.sm-info { flex-direction: column; align-items: flex-start; gap: 5px; }
.sm-purpose { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.deleted-row { opacity: .55; }
.deleted-name { text-decoration: line-through; color: var(--text-secondary); }

.scope-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.scope-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  color: var(--accent);
  background: rgba(76,154,255,.08);
  white-space: nowrap;
}

.scope-row { align-items: flex-start; }
.scope-checks { display: flex; flex-wrap: wrap; gap: 10px; }
.scope-check-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}
.scope-checkbox { accent-color: var(--accent); cursor: pointer; }


/* ── § 兌換品項管理 ── */
.ri-info { flex-direction: column; align-items: flex-start; gap: 4px; }
.ri-rate { font-size: 12px; color: var(--accent); }
.ri-desc { font-size: 12px; color: var(--text-secondary); }
.ri-enabled-label { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text-primary); cursor: pointer; white-space: nowrap; }

/* ── § 覆蓋區域 ── */
.ca-geo-row { align-items: flex-start; }
.ca-geo-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.ca-textarea { width: 100%; box-sizing: border-box; }

/* ── § 服務區域邊界 ── */
.section-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 14px;
  line-height: 1.6;
}

.boundary-code {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 16px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: pre;
  overflow-x: auto;
  margin: 0;
}

.boundary-textarea {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--mono);
  font-size: 12px;
  padding: 10px 14px;
  resize: vertical;
  outline: none;
  line-height: 1.7;
  box-sizing: border-box;
}
.boundary-textarea:focus { border-color: var(--accent); }

.file-hidden { display: none; }

.form-error {
  font-size: 12px;
  color: var(--danger);
  background: rgba(229,96,76,.08);
  border: 1px solid var(--danger);
  border-radius: 6px;
  padding: 6px 12px;
  margin: 0;
}
</style>
