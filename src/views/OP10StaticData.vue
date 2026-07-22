<template>
  <div class="op10-root">
    <OpsTopBar title="靜態資料管理（OP-10）" />

    <div class="content">

      <!-- ① 熱點區域 ─────────────────────────────────────── -->
      <InfoCard title="熱點區域">
        <div class="item-list">
          <div v-for="hs in store.hotspots" :key="hs.id" class="item-row">
            <!-- 顯示態 -->
            <template v-if="hsEditingId !== hs.id">
              <div class="item-info">
                <span class="item-id mono">{{ hs.id }}</span>
                <span class="item-name">{{ hs.name }}</span>
                <span class="item-sub mono">({{ hs.lat }}, {{ hs.lng }})</span>
                <span class="item-badge">半徑 {{ hs.radius.toLocaleString() }} m</span>
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
                <input v-model="hsDraft.name" class="form-input" placeholder="熱點名稱" />
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="hsDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="hsDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-row">
                <label class="form-label">半徑</label>
                <input v-model.number="hsDraft.radius" type="number" min="1" class="form-input short mono" />
                <span class="unit-text">m</span>
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
                <input v-model="hsDraft.name" class="form-input" placeholder="熱點名稱" />
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="hsDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="hsDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-row">
                <label class="form-label">半徑</label>
                <input v-model.number="hsDraft.radius" type="number" min="1" class="form-input short mono" />
                <span class="unit-text">m</span>
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

      <!-- ② 地圖事件 POI ──────────────────────────────────── -->
      <InfoCard title="地圖事件 POI">
        <div class="item-list">
          <div v-for="poi in store.mapPOIs" :key="poi.id" class="item-row">
            <!-- 顯示態 -->
            <template v-if="poiEditingId !== poi.id">
              <div class="item-info">
                <span class="item-id mono">{{ poi.id }}</span>
                <span class="item-name">{{ poi.label }}</span>
                <span class="poi-chip" :class="poiChipClass(poi.type)">{{ poi.type }}</span>
                <span class="item-sub mono">({{ poi.lat }}, {{ poi.lng }})</span>
              </div>
              <div class="item-btns">
                <button class="row-btn" :disabled="poiAddingNew || poiEditingId !== null" @click="startPoiEdit(poi)">編輯</button>
                <button class="row-btn danger" :disabled="poiAddingNew || poiEditingId !== null" @click="requestPoiDelete(poi)">刪除</button>
              </div>
            </template>
            <!-- 編輯態 -->
            <div v-else class="item-form">
              <div class="form-row">
                <label class="form-label">標籤</label>
                <input v-model="poiDraft.label" class="form-input" placeholder="地標名稱" />
                <label class="form-label ml">類型</label>
                <select v-model="poiDraft.type" class="form-select">
                  <option v-for="t in POI_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="poiDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="poiDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestPoiUpdate(poi.id)">儲存</button>
                <button class="row-btn" @click="poiEditingId = null">取消</button>
              </div>
            </div>
          </div>

          <!-- 新增表單 -->
          <div v-if="poiAddingNew" class="item-row add-row">
            <div class="item-form">
              <div class="form-row">
                <label class="form-label">標籤</label>
                <input v-model="poiDraft.label" class="form-input" placeholder="地標名稱" />
                <label class="form-label ml">類型</label>
                <select v-model="poiDraft.type" class="form-select">
                  <option v-for="t in POI_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label">緯度</label>
                <input v-model.number="poiDraft.lat" type="number" step="0.0001" class="form-input short mono" />
                <label class="form-label ml">經度</label>
                <input v-model.number="poiDraft.lng" type="number" step="0.0001" class="form-input short mono" />
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestPoiAdd">儲存</button>
                <button class="row-btn" @click="poiAddingNew = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button
            v-if="!poiAddingNew && poiEditingId === null"
            class="add-btn"
            @click="startPoiAdd"
          >＋ 新增 POI</button>
          <button class="text-btn" @click="poiMapOpen = !poiMapOpen">
            {{ poiMapOpen ? '隱藏地圖預覽 ▲' : '顯示地圖預覽 ▼' }}
          </button>
        </div>
        <div v-if="poiMapOpen" class="map-placeholder">
          <span class="map-hint">地圖預覽（串接 Google Maps 後啟用）</span>
        </div>
      </InfoCard>

      <!-- ③ 通知模板文字 ────────────────────────────────────── -->
      <InfoCard title="通知模板文字">
        <div class="tmpl-list">
          <div v-for="meta in TEMPLATE_META" :key="meta.key" class="tmpl-row">
            <div class="tmpl-header">
              <span class="tmpl-label">{{ meta.label }}</span>
              <span class="tmpl-vars">可用變數：<code>{{ meta.vars }}</code></span>
            </div>
            <!-- 顯示態 -->
            <template v-if="tmplEditingKey !== meta.key">
              <p class="tmpl-text">{{ store.notifyTemplates[meta.key] }}</p>
              <button
                class="row-btn"
                :disabled="tmplEditingKey !== null"
                @click="startTmplEdit(meta.key)"
              >修改</button>
            </template>
            <!-- 編輯態 -->
            <div v-else class="tmpl-edit">
              <textarea
                v-model="tmplDraft"
                class="tmpl-textarea"
                rows="2"
                :placeholder="`使用 ${meta.vars} 等變數`"
              />
              <div class="tmpl-preview">
                <span class="preview-label">預覽：</span>{{ tmplPreview }}
              </div>
              <div class="form-actions">
                <button class="row-btn ok" @click="requestTmplUpdate(meta.key)">儲存</button>
                <button class="row-btn" @click="tmplEditingKey = null">取消</button>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- ④ 服務區域邊界 ────────────────────────────────────── -->
      <InfoCard title="服務區域邊界">
        <p class="section-desc">北北基服務範圍 GeoJSON 多邊形邊界；變更後立即影響任務廣播範圍計算。</p>

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
import { ref, computed } from 'vue'
import { useStaticDataStore, TEMPLATE_META, POI_TYPES } from '../stores/staticData'
import { useToastStore }   from '../stores/toast'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import InfoCard     from '../components/shared/InfoCard.vue'
import ConfirmDialog from '../components/shared/ConfirmDialog.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useStaticDataStore()
const toast = useToastStore()

// ── 操作依據選項 ─────────────────────────────────────────────
const DATA_REASONS = [
  { value: 'internal',    label: '內部調整' },
  { value: 'operational', label: '運營需求' },
  { value: 'survey',      label: '實地勘測' },
  { value: 'other',       label: '其他' },
]
const TMPL_REASONS = [
  { value: 'operational', label: '運營調整' },
  { value: 'correction',  label: '文字修正' },
  { value: 'feedback',    label: '多方反饋' },
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
    case 'poi-add':
      store.addPOI(op.data)
      toast.success(`已新增 POI「${op.data.label}」・已留跡`)
      poiAddingNew.value = false
      break
    case 'poi-update':
      store.updatePOI(op.id, op.data)
      toast.success(`已更新 POI「${op.data.label}」・已留跡`)
      poiEditingId.value = null
      break
    case 'poi-delete':
      store.deletePOI(op.id)
      toast.success(`已刪除 POI「${op.name}」・已留跡`)
      break
    case 'tmpl-update':
      store.updateTemplate(op.key, op.text)
      toast.success(`已更新「${op.label}」模板・已留跡`)
      tmplEditingKey.value = null
      break
    case 'boundary-update':
      store.updateBoundary(op.geojson)
      toast.success('已更新服務區域邊界・已留跡')
      boundaryEditing.value = false
      break
  }

  dialog.value.open = false
  pendingOp.value = null
}

// ── § 熱點區域 ─────────────────────────────────────────────
const hsEditingId = ref(null)
const hsAddingNew = ref(false)
const hsDraft     = ref({ name: '', lat: 25.0, lng: 121.5, radius: 500 })
const hsMapOpen   = ref(false)

function startHsEdit(hs) {
  hsAddingNew.value = false
  hsEditingId.value = hs.id
  hsDraft.value = { name: hs.name, lat: hs.lat, lng: hs.lng, radius: hs.radius }
}

function startHsAdd() {
  hsEditingId.value = null
  hsAddingNew.value = true
  hsDraft.value = { name: '', lat: 25.0, lng: 121.5, radius: 500 }
}

function requestHsUpdate(id) {
  if (!hsDraft.value.name.trim()) return
  const d = { ...hsDraft.value }
  pendingOp.value = { type: 'hs-update', id, data: d }
  openDialog({
    title: `確認更新熱點「${d.name}」？`,
    body:  `座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>，半徑：<b style="font-family:var(--mono)">${d.radius} m</b>`,
    reasons: DATA_REASONS,
  })
}

function requestHsAdd() {
  if (!hsDraft.value.name.trim()) return
  const d = { ...hsDraft.value }
  pendingOp.value = { type: 'hs-add', data: d }
  openDialog({
    title: `確認新增熱點「${d.name}」？`,
    body:  `座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>，半徑：<b style="font-family:var(--mono)">${d.radius} m</b>`,
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

// ── § 地圖事件 POI ────────────────────────────────────────
const poiEditingId = ref(null)
const poiAddingNew = ref(false)
const poiDraft     = ref({ label: '', type: '收費站', lat: 25.0, lng: 121.5 })
const poiMapOpen   = ref(false)

const POI_CHIP_MAP = {
  '收費站':  'chip-info',
  '易堵路段': 'chip-warn',
  '匝道':    'chip-ok',
  '警察局':  'chip-accent',
  '其他':    'chip-default',
}
function poiChipClass(type) { return POI_CHIP_MAP[type] ?? 'chip-default' }

function startPoiEdit(poi) {
  poiAddingNew.value = false
  poiEditingId.value = poi.id
  poiDraft.value = { label: poi.label, type: poi.type, lat: poi.lat, lng: poi.lng }
}

function startPoiAdd() {
  poiEditingId.value = null
  poiAddingNew.value = true
  poiDraft.value = { label: '', type: '收費站', lat: 25.0, lng: 121.5 }
}

function requestPoiUpdate(id) {
  if (!poiDraft.value.label.trim()) return
  const d = { ...poiDraft.value }
  pendingOp.value = { type: 'poi-update', id, data: d }
  openDialog({
    title: `確認更新 POI「${d.label}」？`,
    body:  `類型：<b>${d.type}</b>，座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>`,
    reasons: DATA_REASONS,
  })
}

function requestPoiAdd() {
  if (!poiDraft.value.label.trim()) return
  const d = { ...poiDraft.value }
  pendingOp.value = { type: 'poi-add', data: d }
  openDialog({
    title: `確認新增 POI「${d.label}」？`,
    body:  `類型：<b>${d.type}</b>，座標：<b style="font-family:var(--mono)">(${d.lat}, ${d.lng})</b>`,
    reasons: DATA_REASONS,
  })
}

function requestPoiDelete(poi) {
  pendingOp.value = { type: 'poi-delete', id: poi.id, name: poi.label }
  openDialog({
    title: `確認刪除 POI「${poi.label}」？`,
    body:  '此操作將移除此地標，地圖上將不再顯示此標記。',
    reasons: DATA_REASONS,
  })
}

// ── § 通知模板文字 ─────────────────────────────────────────
const tmplEditingKey = ref(null)
const tmplDraft      = ref('')

const PREVIEW_VALUES = { type: '事故', road: '中山路段', points: '50', total: '1,200' }

const tmplPreview = computed(() =>
  tmplDraft.value.replace(/\{(\w+)\}/g, (_, k) => PREVIEW_VALUES[k] ?? `{${k}}`)
)

function startTmplEdit(key) {
  tmplEditingKey.value = key
  tmplDraft.value      = store.notifyTemplates[key]
}

function requestTmplUpdate(key) {
  const text = tmplDraft.value.trim()
  if (!text) return
  const meta = TEMPLATE_META.find(m => m.key === key)
  pendingOp.value = { type: 'tmpl-update', key, text, label: meta.label }
  openDialog({
    title: `確認更新「${meta.label}」模板？`,
    body:  `新模板：<span style="font-family:var(--mono);font-size:12px;color:var(--accent)">${text}</span>`,
    reasons: TMPL_REASONS,
  })
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

.item-btns { display: flex; gap: 6px; flex-shrink: 0; }

/* POI 類型 chip */
.poi-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.chip-info    { background: rgba(88,193,212,.12); color: var(--info);     border: 1px solid var(--info); }
.chip-warn    { background: rgba(230,182,58,.12);  color: var(--warn);     border: 1px solid var(--warn); }
.chip-ok      { background: rgba(63,183,126,.12);  color: var(--ok);       border: 1px solid var(--ok); }
.chip-accent  { background: rgba(76,154,255,.12);  color: var(--accent);   border: 1px solid var(--accent); }
.chip-default { background: rgba(255,255,255,.06); color: var(--text-secondary); border: 1px solid var(--line); }

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

.form-select {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 5px 10px;
  height: 30px;
  outline: none;
  cursor: pointer;
}
.form-select:focus { border-color: var(--accent); }

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

/* ── § 通知模板 ── */
.tmpl-list { display: grid; gap: 0; }

.tmpl-row {
  padding: 16px 0;
  border-bottom: 1px solid rgba(42,53,71,.4);
  display: grid;
  gap: 8px;
}
.tmpl-row:last-child { border-bottom: none; }

.tmpl-header { display: flex; align-items: baseline; gap: 12px; }
.tmpl-label  { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.tmpl-vars   { font-size: 12px; color: var(--text-secondary); }
.tmpl-vars code {
  font-family: var(--mono);
  background: var(--bg-base);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

.tmpl-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  border-left: 2px solid var(--line);
  padding-left: 10px;
}

.tmpl-edit { display: grid; gap: 8px; }

.tmpl-textarea {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 13px;
  padding: 8px 12px;
  resize: vertical;
  outline: none;
  line-height: 1.6;
  box-sizing: border-box;
}
.tmpl-textarea:focus { border-color: var(--accent); }

.tmpl-preview {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255,255,255,.03);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 10px;
  line-height: 1.6;
}
.preview-label { color: var(--text-secondary); margin-right: 4px; }

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

.file-hidden {
  display: none;
}

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
