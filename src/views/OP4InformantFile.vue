<template>
  <div class="op4-root">
    <OpsTopBar
      :title="informantId ? `情報員檔案（OP-4）— ${informantId}` : '情報員檔案（OP-4）'"
    />

    <!-- 搜尋首態 -->
    <div v-if="!informantId" class="search-view">
      <div class="search-wrap">
        <h2 class="search-title">情報員檔案查詢</h2>

        <div class="search-box-wrap">
          <input
            v-model="query"
            class="search-input"
            placeholder="情報員編號（GI-XXXX）…"
            autofocus
          />
        </div>

        <!-- 進階搜尋（高權限） -->
        <div class="adv-header" @click="showAdv = !showAdv">
          <span>進階搜尋</span>
          <span class="priv-badge">高權限</span>
          <span class="adv-arrow">{{ showAdv ? '▲' : '▼' }}</span>
        </div>
        <div v-if="showAdv" class="adv-wrap">
          <input
            v-model="advQuery"
            class="adv-input"
            placeholder="手機末碼 or 姓名（高權限）…"
          />
        </div>

        <!-- 結果 -->
        <div class="result-wrap">
          <div class="result-header">
            <span class="result-count">{{ results.length }} 筆結果</span>
          </div>
          <ul v-if="results.length" class="result-list">
            <InformantResultItem
              v-for="item in results"
              :key="item.id"
              :item="item"
              @select="goProfile"
            />
          </ul>
          <div v-else-if="query || advQuery" class="no-result">
            <p>找不到符合「{{ query || advQuery }}」的情報員</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 檔案態 -->
    <div v-else class="profile-view">
      <InformantProfile :informant-id="informantId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInformantsStore } from '../stores/informants'
import OpsTopBar          from '../components/layout/OpsTopBar.vue'
import InformantResultItem from '../components/op4/InformantResultItem.vue'
import InformantProfile   from '../components/op4/InformantProfile.vue'

const route  = useRoute()
const router = useRouter()
const store  = useInformantsStore()

const informantId = computed(() => route.params.informantId ?? null)

// 搜尋
const query    = ref('')
const advQuery = ref('')
const showAdv  = ref(false)

const results = computed(() => {
  const q   = query.value.trim().toLowerCase()
  const adv = advQuery.value.trim().toLowerCase()
  return store.informants.filter(inf => {
    if (q   && !inf.id.toLowerCase().includes(q))   return false
    if (adv && !inf.name.includes(advQuery.value.trim()) &&
               !inf.phoneSuffix.includes(adv))       return false
    return true
  })
})

function goProfile(id) {
  router.push(`/op4/${id}`)
}
</script>

<style scoped>
.op4-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜尋首態 */
.search-view {
  flex: 1;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 60px 24px 32px;
}
.search-wrap {
  width: 100%;
  max-width: 580px;
  display: grid;
  gap: 16px;
  align-content: start;
}
.search-title {
  font-size: 22px;
  text-align: center;
  margin-bottom: 8px;
}

.search-box-wrap { position: relative; }
.search-input {
  width: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 16px;
  font-family: var(--mono);
  color: var(--text-primary);
  box-sizing: border-box;
}
.search-input:focus { outline: 1px solid var(--accent); }
.search-input::placeholder { color: var(--text-secondary); font-family: var(--sans); }

.adv-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}
.adv-header:hover { color: var(--text-primary); }
.priv-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(76, 154, 255, .12);
  color: var(--accent);
  border: 1px solid var(--accent);
}
.adv-arrow { margin-left: auto; }

.adv-wrap { padding: 4px 0; }
.adv-input {
  width: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--sans);
  color: var(--text-primary);
  box-sizing: border-box;
}
.adv-input:focus { outline: 1px solid var(--accent); }

.result-wrap {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}
.result-header {
  padding: 10px 18px;
  border-bottom: 1px solid var(--line);
}
.result-count { font-size: 13px; color: var(--text-secondary); }
.result-list  { list-style: none; margin: 0; padding: 0; }
.no-result {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 檔案態 */
.profile-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
