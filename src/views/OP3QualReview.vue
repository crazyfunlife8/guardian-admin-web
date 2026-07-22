<template>
  <OpsLayout>
    <template #topbar>
      <OpsTopBar title="資格審核（OP-3）" />
    </template>

    <template #queue>
      <QueuePanel
        title="審核佇列"
        :count="filteredApps.length"
        :filters="FILTERS"
        :active-filter="filterStatus"
        @filter-change="store.setFilter"
      >
        <Op3QueueItem
          v-for="app in filteredApps"
          :key="app.id"
          :item="app"
          :selected="app.id === selectedId"
          @select="store.select"
        />
      </QueuePanel>
    </template>

    <template #detail>
      <Op3Detail />
    </template>
  </OpsLayout>

  <Toast />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useReviewStore } from '../stores/review'
import OpsLayout    from '../components/layout/OpsLayout.vue'
import OpsTopBar    from '../components/layout/OpsTopBar.vue'
import QueuePanel   from '../components/queue/QueuePanel.vue'
import Op3QueueItem from '../components/op3/Op3QueueItem.vue'
import Op3Detail    from '../components/op3/Op3Detail.vue'
import Toast        from '../components/shared/Toast.vue'

const store = useReviewStore()
const { filteredApps, selectedId, filterStatus } = storeToRefs(store)

const FILTERS = [
  { label: '待審核', key: 'pending' },
  { label: '已通過', key: 'approved' },
  { label: '已拒絕', key: 'rejected' },
  { label: '全部',   key: 'all' },
]
</script>
