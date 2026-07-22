<template>
  <OpsLayout>
    <template #topbar>
      <OpsTopBar title="申訴與爭議（OP-5）" />
    </template>

    <template #queue>
      <QueuePanel
        title="申訴佇列"
        :count="filteredAppeals.length"
        :filters="FILTERS"
        :active-filter="filterStatus"
        @filter-change="store.setFilter"
      >
        <Op5QueueItem
          v-for="appeal in filteredAppeals"
          :key="appeal.id"
          :item="appeal"
          :selected="appeal.id === selectedId"
          @select="store.select"
        />
      </QueuePanel>
    </template>

    <template #detail>
      <Op5Detail />
    </template>
  </OpsLayout>

  <Toast />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAppealsStore } from '../stores/appeals'
import OpsLayout    from '../components/layout/OpsLayout.vue'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import QueuePanel   from '../components/queue/QueuePanel.vue'
import Op5QueueItem from '../components/op5/Op5QueueItem.vue'
import Op5Detail    from '../components/op5/Op5Detail.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useAppealsStore()
const { filteredAppeals, selectedId, filterStatus } = storeToRefs(store)

const FILTERS = [
  { label: '待處理', key: 'pending' },
  { label: '處理中', key: 'investigating' },
  { label: '已結案', key: 'closed' },
  { label: '全部',   key: 'all' },
]
</script>
