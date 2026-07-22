<template>
  <!-- 404 態 -->
  <div v-if="!inf" class="not-found">
    <p>找不到情報員 {{ informantId }}</p>
    <RouterLink to="/op4" class="back-link">← 返回搜尋</RouterLink>
  </div>

  <!-- 檔案態 -->
  <div v-else class="profile">
    <!-- 身分列 -->
    <div class="identity-bar">
      <span class="iid">{{ inf.id }}</span>
      <StatusBadge :label="STATUS_LABELS[inf.status]" :variant="STATUS_VARIANTS[inf.status]" />
      <span v-if="inf.status === 'suspended'" class="suspended-note">帳號停權中，不可接任務</span>
      <RouterLink to="/op4" class="back-search">← 返回搜尋</RouterLink>
    </div>

    <!-- 基本資料 -->
    <InfoCard title="基本資料">
      <KeyValue label="姓名">
        <MaskField ref="nameRef" :value="inf.name" masked-text="●●●" @unmask="onUnmask('name')" />
      </KeyValue>
      <KeyValue label="手機末碼">
        <MaskField ref="phoneRef" :value="`**** ${inf.phoneSuffix}`" masked-text="●●●●" @unmask="onUnmask('phone')" />
      </KeyValue>
      <KeyValue label="車牌末碼" :value="`*** ${inf.plateSuffix}`" mono />
      <KeyValue label="服務區域"  :value="inf.zone" />
      <KeyValue label="加入日期"  :value="inf.joinedAt" mono />
    </InfoCard>

    <!-- 審核歷程 -->
    <StatusTimeline
      title="審核歷程"
      :entries="reviewEntries"
    />

    <!-- 信譽紀錄 -->
    <InfoCard title="信譽紀錄">
      <div class="big-num-row">
        <div class="big-num">
          <span class="num" :class="{ 'score-low': inf.reputation.score !== null && inf.reputation.score < 60 }">
            {{ inf.reputation.score ?? '—' }}
          </span>
          <small>信譽分數</small>
        </div>
      </div>
      <KeyValue label="近 30 天正確率" :value="inf.reputation.accuracy30d !== null ? `${inf.reputation.accuracy30d}%` : '資料不足'" mono />
      <KeyValue label="誤報次數"       :value="`${inf.reputation.falseReports} 次`" mono />
    </InfoCard>

    <!-- 任務摘要 -->
    <InfoCard title="任務摘要（本月）">
      <KeyValue label="接單數"     :value="`${inf.taskSummary.monthlyCount} 件`" mono />
      <KeyValue label="完成率"     :value="inf.taskSummary.completionRate ? `${inf.taskSummary.completionRate}%` : '—'" mono />
      <KeyValue label="平均回應時間" :value="inf.taskSummary.avgResponseSec ? `${inf.taskSummary.avgResponseSec} 秒` : '—'" mono />
    </InfoCard>

    <!-- 帳本摘要 -->
    <InfoCard title="帳本摘要">
      <div class="big-num-row">
        <div class="big-num">
          <span class="num accent">{{ inf.balance.redeemable.toLocaleString() }}</span>
          <small>可兌換積分</small>
        </div>
      </div>
      <KeyValue label="凍結中"   :value="inf.balance.frozen.toLocaleString()" mono />
      <KeyValue label="本月累積" :value="inf.balance.monthlyEarned.toLocaleString()" mono />
      <RouterLink :to="`/op9?gid=${inf.id}`" class="ledger-link">→ 詳細帳本（OP-9）</RouterLink>
    </InfoCard>

    <!-- 申訴史 -->
    <InfoCard title="申訴史">
      <div v-if="inf.appealHistory.length" class="appeal-list">
        <div v-for="a in inf.appealHistory" :key="a.date" class="appeal-row">
          <span class="mono date">{{ a.date }}</span>
          <span class="reason">{{ a.reason }}</span>
          <StatusBadge :label="a.result" :variant="a.result === '成立' ? 'ok' : 'danger'" />
        </div>
      </div>
      <p v-else class="empty-note">無申訴紀錄</p>
    </InfoCard>

    <!-- 標記 -->
    <InfoCard title="標記">
      <div class="tags-section">
        <div class="tag-row">
          <span class="tag-label">系統</span>
          <div class="chip-list">
            <span v-if="inf.tags.system.length === 0" class="empty-note">無</span>
            <span v-for="t in inf.tags.system" :key="t" class="chip system">{{ t }}</span>
          </div>
        </div>
        <div class="tag-row">
          <span class="tag-label">人工</span>
          <div class="chip-list">
            <span v-if="inf.tags.manual.length === 0 && !addingTag" class="empty-note">無</span>
            <span v-for="t in inf.tags.manual" :key="t" class="chip manual">
              {{ t }}
              <button class="remove-tag" @click="removeTag(t)">✕</button>
            </span>
            <div v-if="addingTag" class="add-inline">
              <input
                ref="tagInputRef"
                v-model="newTag"
                class="tag-input"
                placeholder="標記名稱…"
                @keyup.enter="confirmAddTag"
                @keyup.escape="addingTag = false"
                maxlength="10"
              />
              <button class="tag-btn ok"     @click="confirmAddTag">確認</button>
              <button class="tag-btn cancel" @click="addingTag = false">取消</button>
            </div>
          </div>
        </div>
        <button v-if="!addingTag" class="add-tag-btn" @click="startAddTag">＋ 新增標記</button>
      </div>
    </InfoCard>

    <!-- 解除遮罩確認對話框 -->
    <ConfirmDialog
      :open="unmaskDialog.open"
      :title="unmaskDialog.title"
      :body="unmaskDialog.body"
      @confirm="onUnmaskConfirm"
      @cancel="unmaskDialog.open = false"
    />

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useInformantsStore } from '../../stores/informants'
import { useToastStore }      from '../../stores/toast'
import StatusBadge    from '../shared/StatusBadge.vue'
import InfoCard       from '../shared/InfoCard.vue'
import KeyValue       from '../shared/KeyValue.vue'
import MaskField      from '../shared/MaskField.vue'
import StatusTimeline from '../shared/StatusTimeline.vue'
import ConfirmDialog  from '../shared/ConfirmDialog.vue'
import Toast          from '../shared/Toast.vue'

const props = defineProps({
  informantId: { type: String, required: true },
})

const store = useInformantsStore()
const toast = useToastStore()

const inf = computed(() => store.getById(props.informantId))

const STATUS_LABELS   = { active: '正常', suspended: '停權', reviewing: '審核中' }
const STATUS_VARIANTS = { active: 'ok',   suspended: 'danger', reviewing: 'wait' }

// 審核史 → StatusTimeline 格式
const reviewEntries = computed(() =>
  (inf.value?.reviewHistory ?? []).map((h, i, arr) => ({
    time:  h.time,
    text:  h.text,
    actor: h.actor ?? null,
    done:  i < arr.length - 1,
  }))
)

// 遮罩
const nameRef        = ref(null)
const phoneRef       = ref(null)
const pendingUnmask  = ref(null)
const unmaskDialog   = ref({ open: false, title: '', body: '' })

function onUnmask(field) {
  pendingUnmask.value = field
  unmaskDialog.value = {
    open:  true,
    title: '確認解除遮罩？',
    body:  '此操作將記錄於稽核日誌，請選擇查閱依據。',
  }
}

function onUnmaskConfirm(reason) {
  if (pendingUnmask.value === 'name')  nameRef.value?.reveal()
  if (pendingUnmask.value === 'phone') phoneRef.value?.reveal()
  pendingUnmask.value  = null
  unmaskDialog.value.open = false
  toast.success('已解除遮罩・已留跡')
}

// 標記
const addingTag   = ref(false)
const newTag      = ref('')
const tagInputRef = ref(null)

async function startAddTag() {
  addingTag.value = true
  newTag.value    = ''
  await nextTick()
  tagInputRef.value?.focus()
}

function confirmAddTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  store.addManualTag(inf.value.id, tag)
  addingTag.value = false
  newTag.value    = ''
  toast.success(`已新增標記「${tag}」`)
}

function removeTag(tag) {
  store.removeManualTag(inf.value.id, tag)
  toast.info(`已移除標記「${tag}」`)
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--text-secondary);
}
.back-link { color: var(--accent); text-decoration: none; font-size: 14px; }

.profile {
  overflow-y: auto;
  padding: 24px 32px;
  display: grid;
  gap: 20px;
  align-content: start;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

/* 身分列 */
.identity-bar {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.iid {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 600;
}
.suspended-note {
  font-size: 13px;
  color: var(--danger);
  border: 1px dashed var(--danger);
  border-radius: 999px;
  padding: 3px 14px;
}
.back-search {
  margin-left: auto;
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
}
.back-search:hover { text-decoration: underline; }

/* 大數字 */
.big-num-row { margin-bottom: 4px; }
.big-num { display: flex; align-items: baseline; gap: 8px; }
.num {
  font-family: var(--mono);
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}
.num.accent   { color: var(--accent); }
.num.score-low { color: var(--danger); }
.big-num small { color: var(--text-secondary); font-size: 13px; }

/* 帳本連結 */
.ledger-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
}
.ledger-link:hover { text-decoration: underline; }

/* 申訴史 */
.appeal-list { display: grid; gap: 10px; }
.appeal-row  { display: flex; align-items: center; gap: 14px; font-size: 14px; }
.date   { color: var(--text-secondary); min-width: 100px; }
.reason { flex: 1; }

/* 標記 */
.tags-section { display: grid; gap: 12px; }
.tag-row { display: flex; align-items: flex-start; gap: 12px; }
.tag-label { font-size: 13px; color: var(--text-secondary); min-width: 36px; padding-top: 2px; }
.chip-list { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chip.system { background: rgba(88, 193, 212, .12); color: var(--info); border: 1px solid var(--info); }
.chip.manual { background: rgba(76, 154, 255, .12); color: var(--accent); border: 1px solid var(--accent); }
.remove-tag {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  opacity: .7;
}
.remove-tag:hover { opacity: 1; }

.add-inline { display: flex; align-items: center; gap: 6px; }
.tag-input {
  background: var(--bg-base);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--sans);
  padding: 4px 10px;
  width: 130px;
  outline: none;
}
.tag-btn {
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: none;
  cursor: pointer;
  padding: 4px 10px;
  font-family: var(--sans);
}
.tag-btn.ok     { color: var(--ok);   border-color: var(--ok); }
.tag-btn.cancel { color: var(--text-secondary); }
.tag-btn:hover  { background: var(--bg-panel-raised); }

.add-tag-btn {
  align-self: start;
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
.add-tag-btn:hover { color: var(--accent); border-color: var(--accent); }

.empty-note { font-size: 13px; color: var(--text-secondary); }
</style>
