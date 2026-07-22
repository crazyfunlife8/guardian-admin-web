<template>
  <OpsLayout>
    <template #topbar>
      <OpsTopBar title="客服工單（OP-13）" />
    </template>

    <template #queue>
      <QueuePanel
        title="工單佇列"
        :count="filteredTickets.length"
        :filters="FILTERS"
        :active-filter="filterStatus"
        add-label="建工單"
        @filter-change="store.setFilter"
        @add-click="openNewTicketModal"
      >
        <Op13QueueItem
          v-for="t in filteredTickets"
          :key="t.id"
          :item="t"
          :selected="t.id === selectedId"
          @select="store.select"
        />
      </QueuePanel>
    </template>

    <template #detail>
      <Op13Detail />
    </template>
  </OpsLayout>

  <Toast />

  <!-- 建工單 Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">

        <div class="modal-head">
          <h3>建工單</h3>
          <button class="modal-close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="mf-row">
            <label class="mf-label">類型 <span class="req">*</span></label>
            <select v-model="draft.type" class="mf-select">
              <option v-for="tp in TICKET_TYPES" :key="tp" :value="tp">{{ tp }}</option>
            </select>
          </div>
          <div class="mf-row">
            <label class="mf-label">說明 <span class="req">*</span></label>
            <textarea
              v-model="draft.description"
              class="mf-textarea"
              rows="4"
              placeholder="請描述問題內容…"
            ></textarea>
          </div>
          <div class="mf-row">
            <label class="mf-label">關聯事件 ID</label>
            <input
              v-model="draft.relatedEventId"
              class="mf-input mono"
              type="text"
              placeholder="如 EV-001（選填）"
            />
          </div>
          <div class="mf-row">
            <label class="mf-label">關聯情報員 ID</label>
            <input
              v-model="draft.relatedInformantId"
              class="mf-input mono"
              type="text"
              placeholder="如 GI-0042（選填）"
            />
          </div>
        </div>

        <div class="modal-foot">
          <button class="mf-cancel-btn" @click="closeModal">取消</button>
          <button class="mf-submit-btn" @click="submitNewTicket">建立工單</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref }         from 'vue'
import { storeToRefs } from 'pinia'
import { useTicketsStore, TICKET_TYPES, FILTERS } from '../stores/tickets'
import { useToastStore } from '../stores/toast'
import OpsLayout     from '../components/layout/OpsLayout.vue'
import OpsTopBar     from '../components/layout/OpsTopBar.vue'
import QueuePanel    from '../components/queue/QueuePanel.vue'
import Op13QueueItem from '../components/op13/Op13QueueItem.vue'
import Op13Detail    from '../components/op13/Op13Detail.vue'
import Toast         from '../components/shared/Toast.vue'

const store = useTicketsStore()
const toast = useToastStore()
const { filteredTickets, selectedId, filterStatus } = storeToRefs(store)

const showModal = ref(false)
const draft     = ref({ type: '積分爭議', description: '', relatedEventId: '', relatedInformantId: '' })

function openNewTicketModal() {
  draft.value = { type: '積分爭議', description: '', relatedEventId: '', relatedInformantId: '' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function submitNewTicket() {
  if (!draft.value.description.trim()) {
    toast.info('請填寫工單說明')
    return
  }
  store.addTicket({ ...draft.value })
  toast.success('工單已建立・已留跡')
  showModal.value = false
}
</script>

<style scoped>
/* ── 建工單 Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  width: 480px;
  background: var(--bg-panel-raised);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--line);
}
.modal-head h3 { font-size: 16px; font-weight: 600; }

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color .12s, background .12s;
}
.modal-close-btn:hover { color: var(--text-primary); background: var(--bg-panel); }

.modal-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mf-row { display: flex; flex-direction: column; gap: 6px; }

.mf-label { font-size: 13px; color: var(--text-secondary); }
.req      { color: var(--danger); }

.mf-select,
.mf-input,
.mf-textarea {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  padding: 8px 12px;
}
.mf-select:focus,
.mf-input:focus,
.mf-textarea:focus { outline: 1px solid var(--accent); }
.mf-textarea { resize: vertical; line-height: 1.6; }
.mf-input.mono { font-family: var(--mono); }

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--line);
}

.mf-cancel-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--sans);
  padding: 9px 18px;
  cursor: pointer;
  transition: color .12s, background .12s;
}
.mf-cancel-btn:hover { color: var(--text-primary); background: var(--bg-panel); }

.mf-submit-btn {
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: #08111F;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--sans);
  padding: 9px 22px;
  cursor: pointer;
  transition: filter .12s;
}
.mf-submit-btn:hover { filter: brightness(1.1); }
</style>
