<template>
  <div class="map">
    <!-- SVG 示意底圖（API Key 到位後換成 <div ref="mapEl"> + Google Maps） -->
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" class="basemap">
      <rect class="district" x="0" y="0" width="1600" height="900"/>
      <path class="water" d="M0 640 Q 300 560 520 660 T 1050 690 T 1600 620 L1600 900 L0 900 Z" opacity=".8"/>
      <path class="road hwy"   d="M-20 300 Q 400 260 800 330 T 1620 280"/>
      <path class="road hwy"   d="M520 -20 Q 560 300 500 520 T 560 920"/>
      <path class="road major" d="M-20 480 L 1620 430"/>
      <path class="road major" d="M900 -20 L 940 920"/>
      <path class="road major" d="M200 -20 L 160 920"/>
      <path class="road major" d="M1250 -20 Q 1220 400 1300 920"/>
      <path class="road" stroke-width="2.5" d="M-20 180 L1620 150"/>
      <path class="road" stroke-width="2.5" d="M-20 720 L1620 760"/>
      <path class="road" stroke-width="2.5" d="M700 -20 L 680 920"/>
      <path class="road" stroke-width="2.5" d="M1100 -20 L 1120 920"/>
      <path class="road" stroke-width="2"   d="M340 -20 L 360 920"/>
      <path class="road" stroke-width="2"   d="M-20 600 L 1620 560"/>
    </svg>
    <span class="map-note">示意底圖——實作＝GOOGLE MAPS 深色樣式・真街道真座標</span>

    <!-- 情報員概略密度 -->
    <span class="den" v-for="(d, i) in densityDots" :key="i" :style="d"></span>

    <!-- 任務圈 -->
    <span
      v-for="ring in taskRings"
      :key="ring.id"
      class="ring"
      :class="ring.kind"
      :style="{ left: ring.x, top: ring.y, width: ring.size, height: ring.size }"
    ></span>

    <!-- 掛點警示 -->
    <span class="stale" style="left:42%;top:23%" title="久未複查掛點">⚠</span>

    <!-- 事件標記 -->
    <span
      v-for="ev in filteredEvents"
      :key="ev.id"
      class="marker"
      :class="{ selected: ev.id === selectedId }"
      :style="{ left: ev.x, top: ev.y }"
      :title="`${TYPE_LABELS[ev.type]}・${STATUS_LABELS[ev.status]}`"
      @click="evStore.select(ev.id)"
    >
      <MarkerIcon :type="ev.type" :status="ev.status" :size="26" />
    </span>

    <!-- 篩選中提示條 -->
    <div
      v-if="hasFilters"
      class="filtering-pill"
      @click="evStore.clearFilters()"
    >● 篩選中：{{ activeFilterLabel }} ✕</div>

    <!-- 浮層元件 -->
    <MapSearch />
    <MapFilter />
    <EventCard
      :event="selectedEvent"
      @close="evStore.clearSelection()"
      @action="handleAction"
    />
    <MapLegend />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useEventsStore } from '../../stores/events'
import MarkerIcon from './MarkerIcon.vue'
import MapSearch  from './MapSearch.vue'
import MapFilter  from './MapFilter.vue'
import EventCard  from './EventCard.vue'
import MapLegend  from './MapLegend.vue'

const evStore = useEventsStore()
const { filteredEvents, selectedId, selectedEvent, hasFilters, activeFilterLabel } = storeToRefs(evStore)

const TYPE_LABELS   = { inspection: '臨時路檢', accident: '事故', construction: '施工', control: '管制' }
const STATUS_LABELS = { unverified: '未確認', verified: '已驗證', cleared: '已解除' }

const densityDots = [
  { left: '47%', top: '38%' }, { left: '49%', top: '41%' },
  { left: '59%', top: '52%' }, { left: '32%', top: '55%' },
  { left: '63%', top: '33%' }, { left: '44%', top: '60%' },
]

const taskRings = [
  { id: 'r1', kind: 'broadcast', x: '58.5%', y: '35%',   size: '120px' },
  { id: 'r2', kind: 'locked',    x: '33%',   y: '52.5%', size: '70px' },
  { id: 'r3', kind: 'overdue',   x: '73%',   y: '62%',   size: '150px' },
]

function handleAction({ eventId, action }) {
  console.log('OP action', eventId, action)
  // TODO: call API → update store
}
</script>

<style scoped>
.map {
  position: absolute;
  inset: 0;
  background: radial-gradient(1200px 700px at 62% 40%, #131B27 0%, #0D1117 70%);
  overflow: hidden;
}
.basemap { position: absolute; inset: 0; width: 100%; height: 100%; }

.district { fill: #141C29; }
.water    { fill: #101825; }
.road     { stroke: #222D3F; fill: none; }
.road.major { stroke: #2C3A52; stroke-width: 5; }
.road.hwy   { stroke: #33415C; stroke-width: 7; }

.map-note {
  position: absolute;
  right: 16px;
  top: 12px;
  font-size: 11px;
  color: #57647A;
  letter-spacing: .08em;
}

/* 情報員密度 */
.den {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 154, 255, .28), transparent 70%);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 任務圈 */
.ring {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
}
.ring.broadcast { border: 2px dashed var(--info); animation: pulse 2s ease-out infinite; }
.ring.locked    { border: 2px solid var(--info); }
.ring.overdue   { border: 2px solid var(--danger); box-shadow: inset 0 0 0 6px rgba(229, 96, 76, .12); }

/* 掛點警示 */
.stale {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 15px;
  color: var(--warn);
  cursor: pointer;
}

/* 事件標記 */
.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .6));
  transition: transform .15s;
}
.marker:hover    { transform: translate(-50%, -50%) scale(1.2); }
.marker.selected { transform: translate(-50%, -50%) scale(1.2); }

/* 篩選中提示 */
.filtering-pill {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  background: rgba(229, 184, 75, .92);
  color: #1A1405;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  padding: 6px 16px;
  cursor: pointer;
  z-index: 22;
  white-space: nowrap;
}
</style>
