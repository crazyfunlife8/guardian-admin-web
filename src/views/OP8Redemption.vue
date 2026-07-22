<template>
  <OpsLayout>
    <template #topbar>
      <OpsTopBar title="兌換核銷（OP-8）" />
    </template>

    <template #queue>
      <QueuePanel
        title="核銷佇列"
        :count="filteredOrders.length"
        :filters="FILTERS"
        :active-filter="filterState"
        add-label="LINE 代收建單"
        @filter-change="store.setFilter"
        @add-click="showAddDialog = true"
      >
        <Op8QueueItem
          v-for="order in filteredOrders"
          :key="order.id"
          :item="order"
          :selected="order.id === selectedId"
          @select="store.select"
        />
      </QueuePanel>
    </template>

    <template #detail>
      <Op8Detail />
    </template>
  </OpsLayout>

  <Toast />

  <!-- TODO: LINE 代收建單對話框 -->
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRedemptionStore } from '../stores/redemption'
import OpsLayout      from '../components/layout/OpsLayout.vue'
import OpsTopBar      from '../components/layout/OpsTopBar.vue'
import QueuePanel     from '../components/queue/QueuePanel.vue'
import Op8QueueItem   from '../components/op8/Op8QueueItem.vue'
import Op8Detail      from '../components/op8/Op8Detail.vue'
import Toast          from '../components/shared/Toast.vue'

const store = useRedemptionStore()
const { filteredOrders, selectedId, filterState } = storeToRefs(store)
const showAddDialog = ref(false)

const FILTERS = [
  { label: '待核對', key: 'wait' },
  { label: '已核對', key: 'checked' },
  { label: '已發放', key: 'issued' },
  { label: '掛起',   key: 'hold' },
  { label: '全部',   key: 'all' },
]
</script>
